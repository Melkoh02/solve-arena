export type Penalty = 'none' | '+2' | 'DNF';

export type TimerPhase =
  | 'idle'
  | 'inspecting'
  | 'preparing'
  | 'ready'
  | 'running'
  | 'stopped';

export interface WCAEvent {
  id: string;
  name: string;
}

export interface Solve {
  id: string;
  time: number;
  scramble: string;
  penalty: Penalty;
  event: string;
  date: number;
}
