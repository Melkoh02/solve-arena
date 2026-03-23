import { makeAutoObservable, runInAction } from 'mobx';
import axios from 'axios';
import type { Penalty } from '../types/timer';
import type { CrossColor } from '../types/room';
import { getEffectiveTime, calculateAverage } from '../utils/averages';
import { PLAYER_NAME_KEY } from '../constants';

const SOLO_SOLVES_KEY = 'soloSolves';
const SOLO_EVENT_KEY = 'soloEventId';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export interface SoloSolve {
  id: string;
  time: number;
  penalty: Penalty;
  scramble: string;
  event: string;
  date: number;
  crossColor: CrossColor;
}

export class SoloStore {
  solves: SoloSolve[] = [];
  eventId = '333';
  currentScramble = '';
  isLoadingScramble = false;

  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
    this.generateScramble();
  }

  get playerName(): string {
    try {
      return localStorage.getItem(PLAYER_NAME_KEY) ?? '';
    } catch {
      return '';
    }
  }

  /** Solves filtered by current event, oldest first */
  get eventSolves(): SoloSolve[] {
    return this.solves.filter(s => s.event === this.eventId);
  }

  /** Solves for current event, newest first */
  get recentSolves(): SoloSolve[] {
    return [...this.eventSolves].reverse();
  }

  get bestTime(): number | null {
    let best = Infinity;
    for (const s of this.eventSolves) {
      const eff = getEffectiveTime(s);
      if (eff < best) best = eff;
    }
    return isFinite(best) ? best : null;
  }

  get ao5(): number | null {
    return calculateAverage(this.recentSolves, 5, 2);
  }

  get ao12(): number | null {
    return calculateAverage(this.recentSolves, 12, 3);
  }

  get lastSolve(): SoloSolve | undefined {
    const es = this.eventSolves;
    return es[es.length - 1];
  }

  get previousSolves(): SoloSolve[] {
    const es = this.eventSolves;
    if (es.length < 2) return [];
    return es.slice(-5, -1).reverse();
  }

  /**
   * Returns history rows for the table: each solve with its rolling ao5/ao12.
   * Newest first.
   */
  get historyRows(): { solve: SoloSolve; index: number; ao5: number | null; ao12: number | null }[] {
    const es = this.eventSolves;
    const rows: { solve: SoloSolve; index: number; ao5: number | null; ao12: number | null }[] = [];

    for (let i = es.length - 1; i >= 0; i--) {
      // For rolling averages, slice the solves up to and including index i, newest first
      const window = es.slice(0, i + 1).reverse();
      rows.push({
        solve: es[i],
        index: i + 1,
        ao5: calculateAverage(window, 5, 2),
        ao12: calculateAverage(window, 12, 3),
      });
    }

    return rows;
  }

  addSolve(time: number, dnf: boolean, crossColor: CrossColor = 'w') {
    const solve: SoloSolve = {
      id: crypto.randomUUID(),
      time,
      penalty: dnf ? 'DNF' : 'none',
      scramble: this.currentScramble,
      event: this.eventId,
      date: Date.now(),
      crossColor,
    };
    this.solves.push(solve);
    this.saveToStorage();
    this.generateScramble();
  }

  updatePenalty(solveId: string, penalty: Penalty) {
    const solve = this.solves.find(s => s.id === solveId);
    if (!solve) return;
    solve.penalty = solve.penalty === penalty ? 'none' : penalty;
    this.saveToStorage();
  }

  updateCrossColor(solveId: string, crossColor: CrossColor) {
    const solve = this.solves.find(s => s.id === solveId);
    if (!solve) return;
    solve.crossColor = crossColor;
    this.saveToStorage();
  }

  changeEvent(eventId: string) {
    this.eventId = eventId;
    try {
      localStorage.setItem(SOLO_EVENT_KEY, eventId);
    } catch {
      // ignore
    }
    this.generateScramble();
  }

  clearSolves() {
    // Only clear solves for the current event
    this.solves = this.solves.filter(s => s.event !== this.eventId);
    this.saveToStorage();
  }

  async generateScramble() {
    this.isLoadingScramble = true;
    try {
      // Primary: generate client-side (works offline)
      const { randomScrambleForEvent } = await import('cubing/scramble');
      const scramble = await randomScrambleForEvent(this.eventId);
      runInAction(() => {
        this.currentScramble = scramble.toString();
        this.isLoadingScramble = false;
      });
    } catch {
      try {
        // Fallback: request from server
        const { data } = await axios.get(`${SOCKET_URL}/api/scramble/${this.eventId}`);
        runInAction(() => {
          this.currentScramble = data.scramble;
          this.isLoadingScramble = false;
        });
      } catch {
        runInAction(() => {
          this.currentScramble = 'Error generating scramble';
          this.isLoadingScramble = false;
        });
      }
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(SOLO_SOLVES_KEY, JSON.stringify(this.solves));
    } catch {
      // ignore
    }
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(SOLO_SOLVES_KEY);
      if (saved) this.solves = JSON.parse(saved);
      const event = localStorage.getItem(SOLO_EVENT_KEY);
      if (event) this.eventId = event;
    } catch {
      // ignore
    }
  }
}
