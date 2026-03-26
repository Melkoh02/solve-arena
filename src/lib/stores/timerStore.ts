import { makeAutoObservable } from 'mobx';
import type { TimerPhase } from '../types/timer';

export class TimerStore {
  timerPhase: TimerPhase = 'idle';
  startTime: number | null = null;
  displayTime = 0;
  lastStopWasDnf = false;
  /** Phase to return to if preparing is cancelled */
  private phaseBeforePreparing: TimerPhase = 'idle';

  constructor() {
    makeAutoObservable(this, {
      startTime: false,
    });
  }

  /** Enter preparing state (red). Remembers previous phase for cancel. */
  setPreparing() {
    if (this.timerPhase === 'idle' || this.timerPhase === 'stopped') {
      this.phaseBeforePreparing = this.timerPhase;
      this.timerPhase = 'preparing';
    }
  }

  /** Transition to ready (green) from preparing, idle, or stopped */
  setReady() {
    if (this.timerPhase === 'preparing' || this.timerPhase === 'idle' || this.timerPhase === 'stopped') {
      if (this.timerPhase !== 'preparing') {
        this.phaseBeforePreparing = this.timerPhase;
      }
      this.displayTime = 0;
      this.timerPhase = 'ready';
    }
  }

  /** Cancel preparing or ready and return to previous state */
  cancelPreparing() {
    if (this.timerPhase === 'preparing' || this.timerPhase === 'ready') {
      this.timerPhase = this.phaseBeforePreparing;
    }
  }

  startTimer() {
    if (this.timerPhase === 'ready') {
      this.startTime = Date.now();
      this.displayTime = 0;
      this.timerPhase = 'running';
    }
  }

  stopTimer(dnf = false) {
    if (this.timerPhase === 'running' && this.startTime !== null) {
      this.displayTime = Date.now() - this.startTime;
      this.timerPhase = 'stopped';
      this.startTime = null;
      this.lastStopWasDnf = dnf;
    }
  }

  updateDisplayTime(time: number) {
    this.displayTime = time;
  }

  resetToIdle() {
    this.timerPhase = 'idle';
    this.displayTime = 0;
    this.lastStopWasDnf = false;
  }
}
