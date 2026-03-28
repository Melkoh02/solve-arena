import { makeAutoObservable, runInAction } from 'mobx';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, Player, RoomSolve, RoomState, ServerToClientEvents, } from '../types/room';
import type { Penalty } from '../types/timer';
import { PLAYER_NAME_KEY } from '../constants';
import { getEffectiveTime } from '../utils/averages';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const CONNECTION_TIMEOUT_MS = 30000;

export interface PbNotification {
  playerName: string;
  playerId: string;
  time: string;
  isSelf: boolean;
}

export class RoomStore {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  isConnected = false;

  // Room state (from server)
  roomCode: string | null = null;
  hostId: string | null = null;
  eventId = '333';
  currentScramble = '';
  currentRound = 0;
  players: Player[] = [];
  solves: RoomSolve[] = [];

  // Local state
  playerName = '';
  error: string | null = null;
  isJoining = false;
  isReconnecting = false;
  pendingSubmissionRound: number | null = null;
  solvingPlayerIds: Set<string> = new Set();
  private lastKnownPlayerId: string | null = null;
  private pendingRejoinCode: string | null = null;

  // PB tracking
  pbNotificationQueue: PbNotification[] = [];
  private previousBestTimes = new Map<string, number>();
  private processedSolveIds = new Set<string>();

  constructor() {
    makeAutoObservable(this, {
      socket: false,
    });

    this.loadPlayerName();

    this.socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      runInAction(() => {
        this.isConnected = true;
        // Auto-rejoin if we were in a room
        if (this.pendingRejoinCode && this.lastKnownPlayerId) {
          this.isReconnecting = true;
          const code = this.pendingRejoinCode;
          const oldId = this.lastKnownPlayerId;
          this.pendingRejoinCode = null;
          this.socket.emit('rejoin-room', {
            roomCode: code,
            playerName: this.playerName,
            oldPlayerId: oldId,
          }, (response) => {
            runInAction(() => {
              this.isReconnecting = false;
              if ('error' in response) {
                // Room gone, clear state
                this.roomCode = null;
                this.players = [];
                this.solves = [];
                this.currentRound = 0;
                this.currentScramble = '';
              }
            });
          });
        }
        // Track current socket id for future reconnects
        this.lastKnownPlayerId = this.socket.id ?? null;
      });
    });

    this.socket.on('disconnect', () => {
      runInAction(() => {
        this.isConnected = false;
        // If we were in a room, preserve state for rejoin
        // lastKnownPlayerId was already saved on connect
        if (this.roomCode) {
          this.pendingRejoinCode = this.roomCode;
          this.isReconnecting = true;
        }
        this.pendingSubmissionRound = null;
        this.solvingPlayerIds.clear();
      });
    });

    this.socket.on('room-state', (state: RoomState) => {
      runInAction(() => {
        const prevRound = this.currentRound;

        this.roomCode = state.code;
        this.hostId = state.hostId;
        this.eventId = state.eventId;
        this.currentScramble = state.currentScramble;
        this.currentRound = state.currentRound;
        this.players = state.players;
        this.solves = state.solves;

        // Clear solving players when round advances or when they've submitted
        if (state.currentRound !== prevRound) {
          this.solvingPlayerIds.clear();
        } else {
          const currentRoundSolveIds = new Set(
            state.solves.filter(s => s.round === state.currentRound).map(s => s.playerId),
          );
          for (const id of this.solvingPlayerIds) {
            if (currentRoundSolveIds.has(id)) {
              this.solvingPlayerIds.delete(id);
            }
          }
        }

        // Clear optimistic submit state once the server reflects our submission
        // or once the round has advanced.
        if (
          this.pendingSubmissionRound !== null &&
          this.socket.id &&
          (state.currentRound > this.pendingSubmissionRound ||
            state.solves.some(
              s =>
                s.playerId === this.socket.id &&
                s.round === this.pendingSubmissionRound,
            ))
        ) {
          this.pendingSubmissionRound = null;
        }
        // Detect PBs from solves we haven't processed yet
        for (const solve of state.solves) {
          if (!this.processedSolveIds.has(solve.id)) {
            this.processedSolveIds.add(solve.id);
            this.checkForPb(solve, state.solves);
          }
        }
      });
    });

    this.socket.on('kicked', () => {
      runInAction(() => {
        this.roomCode = null;
        this.players = [];
        this.solves = [];
        this.error = 'errors.kicked';
      });
      this.socket.disconnect();
    });

    this.socket.on('player-solving', ({ playerId }) => {
      runInAction(() => {
        this.solvingPlayerIds.add(playerId);
      });
    });

    this.socket.on('error', ({ message }) => {
      runInAction(() => {
        this.error = message;
      });
    });
  }

  get isInRoom(): boolean {
    return this.roomCode !== null && (this.isConnected || this.isReconnecting);
  }

  get isHost(): boolean {
    return this.socket.id != null && this.socket.id === this.hostId;
  }

  get playerId(): string | undefined {
    return this.socket.id;
  }

  get currentRoundSolves(): RoomSolve[] {
    return this.solves.filter(s => s.round === this.currentRound);
  }

  get submittedPlayersCountCurrentRound(): number {
    const submittedIds = new Set(this.currentRoundSolves.map(s => s.playerId));
    if (
      this.pendingSubmissionRound === this.currentRound &&
      this.socket.id &&
      !submittedIds.has(this.socket.id)
    ) {
      submittedIds.add(this.socket.id);
    }
    return submittedIds.size;
  }

  get remainingPlayersCountCurrentRound(): number {
    return Math.max(0, this.players.length - this.submittedPlayersCountCurrentRound);
  }

  get areAllPlayersSubmittedCurrentRound(): boolean {
    return this.players.length > 0 && this.remainingPlayersCountCurrentRound === 0;
  }

  get hasSubmittedCurrentRound(): boolean {
    if (!this.socket.id) return false;
    return this.currentRoundSolves.some(s => s.playerId === this.socket.id);
  }

  get hasSubmittedOrPendingCurrentRound(): boolean {
    return (
      this.hasSubmittedCurrentRound ||
      this.pendingSubmissionRound === this.currentRound
    );
  }

  get isWaitingForOtherPlayers(): boolean {
    if (this.players.length <= 1) return false;
    return (
      this.hasSubmittedOrPendingCurrentRound &&
      !this.areAllPlayersSubmittedCurrentRound
    );
  }

  get myCurrentRoundSolve(): RoomSolve | undefined {
    if (!this.socket.id) return undefined;
    return this.currentRoundSolves.find(s => s.playerId === this.socket.id);
  }

  setPlayerName(name: string) {
    this.playerName = name;
    localStorage.setItem(PLAYER_NAME_KEY, name);
  }

  clearError() {
    this.error = null;
  }

  private ensureConnected(): Promise<void> {
    if (this.socket.connected) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.socket.off('connect', onConnect);
        this.socket.disconnect();
        reject(new Error('Connection timed out'));
      }, CONNECTION_TIMEOUT_MS);

      const onConnect = () => {
        clearTimeout(timer);
        resolve();
      };

      this.socket.once('connect', onConnect);
      this.socket.connect();
    });
  }

  async createRoom(): Promise<string | null> {
    this.isJoining = true;
    this.error = null;

    try {
      await this.ensureConnected();
    } catch {
      runInAction(() => {
        this.error = 'errors.connectionFailed';
        this.isJoining = false;
      });
      return null;
    }

    return new Promise(resolve => {
      this.socket.emit(
        'create-room',
        { playerName: this.playerName },
        response => {
          runInAction(() => {
            this.isJoining = false;
            if ('error' in response) {
              this.error = response.error;
              resolve(null);
            } else {
              this.roomCode = response.roomCode;
              resolve(response.roomCode);
            }
          });
        },
      );
    });
  }

  async joinRoom(roomCode: string): Promise<boolean> {
    this.isJoining = true;
    this.error = null;

    try {
      await this.ensureConnected();
    } catch {
      runInAction(() => {
        this.error = 'errors.connectionFailed';
        this.isJoining = false;
      });
      return false;
    }

    return new Promise(resolve => {
      this.socket.emit(
        'join-room',
        { roomCode: roomCode.toUpperCase(), playerName: this.playerName },
        response => {
          runInAction(() => {
            if ('error' in response) {
              this.isJoining = false;
              this.error = response.error;
              resolve(false);
            } else {
              // Set roomCode immediately so isInRoom is true before
              // the room-state event arrives, preventing the redirect guard
              // in RoomScreen from bouncing us back to the lobby.
              this.roomCode = roomCode.toUpperCase();
              this.isJoining = false;
              resolve(true);
            }
          });
        },
      );
    });
  }

  leaveRoom() {
    this.socket.emit('leave-room');
    this.socket.disconnect();
    this.roomCode = null;
    this.players = [];
    this.solves = [];
    this.currentRound = 0;
    this.currentScramble = '';
    this.pbNotificationQueue = [];
    this.previousBestTimes.clear();
    this.processedSolveIds.clear();
    this.pendingSubmissionRound = null;
    this.pendingRejoinCode = null;
    this.lastKnownPlayerId = null;
    this.isReconnecting = false;
  }

  emitTimerStart() {
    if (this.socket.id) this.solvingPlayerIds.add(this.socket.id);
    this.socket.emit('timer-start');
  }

  submitTime(time: number, dnf = false) {
    if (this.socket.id) this.solvingPlayerIds.delete(this.socket.id);
    this.pendingSubmissionRound = this.currentRound;
    this.socket.emit('submit-time', { time, dnf });
  }

  updatePenalty(solveId: string, penalty: Penalty) {
    this.socket.emit('update-penalty', { solveId, penalty });
  }

  updateCrossColor(solveId: string, crossColor: RoomSolve['crossColor'] & string) {
    this.socket.emit('update-cross-color', { solveId, crossColor });
  }

  changeEvent(eventId: string) {
    this.socket.emit('change-event', { eventId });
  }

  kickPlayer(playerId: string) {
    this.socket.emit('kick-player', { playerId });
  }

  nextScramble() {
    this.socket.emit('next-scramble');
  }

  resetRoom() {
    this.socket.emit('reset-room');
  }

  getBestTime(playerId: string): number | null {
    let best = Infinity;
    for (const s of this.solves) {
      if (s.playerId !== playerId) continue;
      const eff = getEffectiveTime(s);
      if (eff < best) best = eff;
    }
    return isFinite(best) ? best : null;
  }

  getGlobalAverage(playerId: string): number | null {
    const times: number[] = [];
    for (const s of this.solves) {
      if (s.playerId !== playerId) continue;
      const eff = getEffectiveTime(s);
      if (isFinite(eff)) times.push(eff);
    }
    if (times.length === 0) return null;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  shiftPbNotification(): PbNotification | undefined {
    return this.pbNotificationQueue.shift();
  }

  private checkForPb(solve: RoomSolve, _allSolves: RoomSolve[]) {
    const effTime = getEffectiveTime(solve);
    if (!isFinite(effTime)) return; // DNF — no PB

    const prevBest = this.previousBestTimes.get(solve.playerId);

    // First solve — set baseline, no notification
    if (prevBest === undefined) {
      this.previousBestTimes.set(solve.playerId, effTime);
      return;
    }

    if (effTime < prevBest) {
      // New PB!
      this.previousBestTimes.set(solve.playerId, effTime);

      const minutes = Math.floor(effTime / 60000);
      const seconds = (effTime % 60000) / 1000;
      const timeStr = minutes > 0
        ? `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`
        : seconds.toFixed(2);

      this.pbNotificationQueue.push({
        playerName: solve.playerName,
        playerId: solve.playerId,
        time: timeStr,
        isSelf: solve.playerId === this.socket.id,
      });
    } else if (effTime < (this.previousBestTimes.get(solve.playerId) ?? Infinity)) {
      // Not a PB but update tracking if needed
      this.previousBestTimes.set(solve.playerId, effTime);
    }
  }

  private loadPlayerName() {
    try {
      const saved = localStorage.getItem(PLAYER_NAME_KEY);
      if (saved) this.playerName = saved;
    } catch {
      // ignore
    }
  }
}
