import { makeAutoObservable, runInAction } from 'mobx';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, Player, RoomSolve, RoomState, ServerToClientEvents, } from '../types/room';
import type { Penalty } from '../types/timer';
import { PLAYER_NAME_KEY } from '../constants';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const CONNECTION_TIMEOUT_MS = 30000;

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
  pendingSubmissionRound: number | null = null;

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
      });
    });

    this.socket.on('disconnect', () => {
      runInAction(() => {
        this.isConnected = false;
        this.roomCode = null;
        this.players = [];
        this.solves = [];
        this.currentRound = 0;
        this.currentScramble = '';
        this.pendingSubmissionRound = null;
      });
    });

    this.socket.on('room-state', (state: RoomState) => {
      runInAction(() => {
        this.roomCode = state.code;
        this.hostId = state.hostId;
        this.eventId = state.eventId;
        this.currentScramble = state.currentScramble;
        this.currentRound = state.currentRound;
        this.players = state.players;
        this.solves = state.solves;

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

    this.socket.on('error', ({ message }) => {
      runInAction(() => {
        this.error = message;
      });
    });
  }

  get isInRoom(): boolean {
    return this.roomCode !== null && this.isConnected;
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
    this.pendingSubmissionRound = null;
  }

  submitTime(time: number, dnf = false) {
    this.pendingSubmissionRound = this.currentRound;
    this.socket.emit('submit-time', { time, dnf });
  }

  updatePenalty(solveId: string, penalty: Penalty) {
    this.socket.emit('update-penalty', { solveId, penalty });
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

  private loadPlayerName() {
    try {
      const saved = localStorage.getItem(PLAYER_NAME_KEY);
      if (saved) this.playerName = saved;
    } catch {
      // ignore
    }
  }
}
