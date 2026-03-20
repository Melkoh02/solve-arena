import { makeAutoObservable } from 'mobx';
import type { TimerPhase } from '../types/timer';

export class TimerStore {
  timerPhase: TimerPhase = 'idle';
  startTime: number | null = null;
  displayTime = 0;
  lastStopWasDnf = false;

  constructor() {
    makeAutoObservable(this, {
      startTime: false,
    });
  }

  setReady() {
    if (this.timerPhase === 'idle') {
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
