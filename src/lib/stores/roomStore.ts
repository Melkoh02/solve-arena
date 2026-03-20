import { makeAutoObservable, runInAction } from 'mobx';
import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  Player,
  RoomSolve,
  RoomState,
  ServerToClientEvents,
} from '../types/room';
import type { Penalty } from '../types/timer';
import { PLAYER_NAME_KEY } from '../constants';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

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

  constructor() {
    makeAutoObservable(this, {
      socket: false,
    });

    this.loadPlayerName();

    this.socket = io(SOCKET_URL, { autoConnect: false });

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
      });
    });

    this.socket.on('kicked', () => {
      runInAction(() => {
        this.roomCode = null;
        this.players = [];
        this.solves = [];
        this.error = 'You were kicked from the room';
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

  get hasSubmittedCurrentRound(): boolean {
    if (!this.socket.id) return false;
    return this.currentRoundSolves.some(s => s.playerId === this.socket.id);
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

  private async ensureConnected(): Promise<void> {
    if (this.socket.connected) return;
    this.socket.connect();
    return new Promise(resolve => {
      this.socket.once('connect', resolve);
    });
  }

  async createRoom(): Promise<string | null> {
    this.isJoining = true;
    this.error = null;

    await this.ensureConnected();

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

    await this.ensureConnected();

    return new Promise(resolve => {
      this.socket.emit(
        'join-room',
        { roomCode: roomCode.toUpperCase(), playerName: this.playerName },
        response => {
          runInAction(() => {
            this.isJoining = false;
            if ('error' in response) {
              this.error = response.error;
              resolve(false);
            } else {
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
  }

  submitTime(time: number) {
    this.socket.emit('submit-time', { time });
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

  private loadPlayerName() {
    try {
      const saved = localStorage.getItem(PLAYER_NAME_KEY);
      if (saved) this.playerName = saved;
    } catch {
      // ignore
    }
  }
}
