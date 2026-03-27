import type { Penalty } from './timer';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

export type CrossColor = 'w' | 'y' | 'r' | 'o' | 'b' | 'g';

export interface RoomSolve {
  id: string;
  playerId: string;
  playerName: string;
  time: number;
  penalty: Penalty;
  round: number;
  scramble: string;
  date: number;
  crossColor?: CrossColor;
}

export interface RoomState {
  code: string;
  hostId: string;
  eventId: string;
  currentScramble: string;
  currentRound: number;
  players: Player[];
  solves: RoomSolve[];
}

export interface ClientToServerEvents {
  'create-room': (
    data: { playerName: string },
    callback: (response: { roomCode: string } | { error: string }) => void,
  ) => void;
  'join-room': (
    data: { roomCode: string; playerName: string },
    callback: (response: { success: boolean } | { error: string }) => void,
  ) => void;
  'leave-room': () => void;
  'submit-time': (data: { time: number; dnf?: boolean }) => void;
  'update-penalty': (data: { solveId: string; penalty: Penalty }) => void;
  'update-cross-color': (data: { solveId: string; crossColor: CrossColor }) => void;
  'change-event': (data: { eventId: string }) => void;
  'kick-player': (data: { playerId: string }) => void;
  'next-scramble': () => void;
  'reset-room': () => void;
  'timer-start': () => void;
}

export interface ServerToClientEvents {
  'room-state': (state: RoomState) => void;
  'player-solving': (data: { playerId: string }) => void;
  kicked: () => void;
  error: (data: { message: string }) => void;
}
