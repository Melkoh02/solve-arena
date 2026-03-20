import { makeAutoObservable, runInAction } from 'mobx';
import { randomScrambleForEvent } from 'cubing/scramble';
import type { Solve, Penalty, TimerPhase, WCAEvent } from '../types/timer';
import { DEFAULT_EVENT, WCA_EVENTS } from '../constants/wcaEvents';
import { SOLVES_STORAGE_KEY, SELECTED_EVENT_KEY } from '../constants';

export class TimerStore {
  currentEvent: WCAEvent = DEFAULT_EVENT;
  currentScramble = '';
  isGeneratingScramble = false;
  solves: Solve[] = [];
  timerPhase: TimerPhase = 'idle';
  startTime: number | null = null;
  displayTime = 0;

  constructor() {
    makeAutoObservable(this, {
      startTime: false,
    });
    this.loadSolves();
    this.loadSelectedEvent();
    this.generateScramble();
  }

  setEvent(event: WCAEvent) {
    this.currentEvent = event;
    localStorage.setItem(SELECTED_EVENT_KEY, event.id);
    this.generateScramble();
  }

  async generateScramble() {
    this.isGeneratingScramble = true;
    try {
      const scramble = await randomScrambleForEvent(this.currentEvent.id);
      runInAction(() => {
        this.currentScramble = scramble.toString();
        this.isGeneratingScramble = false;
      });
    } catch {
      runInAction(() => {
        this.currentScramble = 'Error generating scramble';
        this.isGeneratingScramble = false;
      });
    }
  }

  setReady() {
    if (this.timerPhase === 'idle' || this.timerPhase === 'stopped') {
      this.displayTime = 0;
      this.timerPhase = 'ready';
    }
  }

  startTimer() {
    if (this.timerPhase === 'ready') {
      this.startTime = Date.now();
      this.displayTime = 0;
      this.timerPhase = 'running';
    }
  }

  stopTimer() {
    if (this.timerPhase === 'running' && this.startTime !== null) {
      const elapsed = Date.now() - this.startTime;
      this.displayTime = elapsed;
      this.timerPhase = 'stopped';
      this.addSolve(elapsed);
      this.startTime = null;
    }
  }

  updateDisplayTime(time: number) {
    this.displayTime = time;
  }

  resetToIdle() {
    this.timerPhase = 'idle';
  }

  private addSolve(time: number) {
    const solve: Solve = {
      id: crypto.randomUUID(),
      time,
      scramble: this.currentScramble,
      penalty: 'none',
      event: this.currentEvent.id,
      date: Date.now(),
    };
    this.solves.unshift(solve);
    this.saveSolves();
    this.generateScramble();
  }

  setPenalty(solveId: string, penalty: Penalty) {
    const solve = this.solves.find(s => s.id === solveId);
    if (solve) {
      solve.penalty = solve.penalty === penalty ? 'none' : penalty;
      this.saveSolves();
    }
  }

  deleteSolve(solveId: string) {
    this.solves = this.solves.filter(s => s.id !== solveId);
    this.saveSolves();
  }

  get currentEventSolves(): Solve[] {
    return this.solves.filter(s => s.event === this.currentEvent.id);
  }

  private saveSolves() {
    try {
      localStorage.setItem(SOLVES_STORAGE_KEY, JSON.stringify(this.solves));
    } catch {
      // ignore
    }
  }

  private loadSolves() {
    try {
      const saved = localStorage.getItem(SOLVES_STORAGE_KEY);
      if (saved) {
        this.solves = JSON.parse(saved);
      }
    } catch {
      // ignore
    }
  }

  private loadSelectedEvent() {
    try {
      const savedId = localStorage.getItem(SELECTED_EVENT_KEY);
      if (savedId) {
        const event = WCA_EVENTS.find(e => e.id === savedId);
        if (event) this.currentEvent = event;
      }
    } catch {
      // ignore
    }
  }
}
