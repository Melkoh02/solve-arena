import { makeAutoObservable } from 'mobx';
import type { TimerPhase } from '../types/timer';

export type InspectionPenalty = 'none' | '+2';

export class TimerStore {
  timerPhase: TimerPhase = 'idle';
  startTime: number | null = null;
  displayTime = 0;
  lastStopWasDnf = false;
  showDnf = false;
  /** Phase to return to if preparing is cancelled */
  private phaseBeforePreparing: TimerPhase = 'idle';

  // ── Inspection state ──────────────────────────────────
  inspectionStartTime: number | null = null;
  inspectionElapsedMs = 0;
  inspectionPenalty: InspectionPenalty = 'none';

  constructor() {
    makeAutoObservable(this, {
      startTime: false,
      inspectionStartTime: false,
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
    if (
      this.timerPhase === 'preparing' ||
      this.timerPhase === 'idle' ||
      this.timerPhase === 'stopped'
    ) {
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

  setShowDnf(val: boolean) {
    this.showDnf = val;
  }

  // ── Inspection ─────────────────────────────────────────

  /** Begin inspection countdown. Only valid from idle or stopped. */
  startInspection() {
    if (this.timerPhase !== 'idle' && this.timerPhase !== 'stopped') return;
    this.inspectionStartTime = Date.now();
    this.inspectionElapsedMs = 0;
    this.inspectionPenalty = 'none';
    this.displayTime = 0;
    this.lastStopWasDnf = false;
    this.showDnf = false;
    this.timerPhase = 'inspecting';
  }

  /** Update inspection elapsed time from the wall clock. Called by RAF loop. */
  tickInspection() {
    if (this.timerPhase !== 'inspecting' || this.inspectionStartTime === null)
      return;
    this.inspectionElapsedMs = Date.now() - this.inspectionStartTime;
  }

  /**
   * Compute the WCA inspection penalty based on overrun and clear inspection
   * timing state. Does NOT change `timerPhase` — caller transitions to
   * `preparing` or `ready` immediately after.
   */
  endInspection(durationSeconds: number) {
    if (this.timerPhase !== 'inspecting') return;
    const elapsed =
      this.inspectionStartTime !== null
        ? Date.now() - this.inspectionStartTime
        : this.inspectionElapsedMs;
    const limitMs = durationSeconds * 1000;
    if (elapsed <= limitMs) {
      this.inspectionPenalty = 'none';
    } else if (elapsed <= limitMs + 2000) {
      this.inspectionPenalty = '+2';
    } else {
      // Caller should have invoked forceDnfFromInspection already; record DNF.
      this.inspectionPenalty = 'none';
      this.lastStopWasDnf = true;
    }
    this.inspectionStartTime = null;
    this.inspectionElapsedMs = 0;
  }

  /** Cancel inspection and return to idle without recording a solve. */
  cancelInspection() {
    if (this.timerPhase !== 'inspecting') return;
    this.timerPhase = 'idle';
    this.inspectionStartTime = null;
    this.inspectionElapsedMs = 0;
    this.inspectionPenalty = 'none';
    this.displayTime = 0;
  }

  /**
   * Force a DNF from inspection (overran by more than 2s). Transitions to
   * `stopped` so the existing solve-submission reactions on Solo/Room screens
   * pick it up.
   */
  forceDnfFromInspection() {
    if (this.timerPhase !== 'inspecting') return;
    this.displayTime = 0;
    this.timerPhase = 'stopped';
    this.lastStopWasDnf = true;
    this.inspectionStartTime = null;
    this.inspectionElapsedMs = 0;
    this.inspectionPenalty = 'none';
  }

  /** Clear the consumed inspection penalty after a solve has been recorded. */
  clearInspectionPenalty() {
    this.inspectionPenalty = 'none';
  }

  resetToIdle() {
    this.timerPhase = 'idle';
    this.displayTime = 0;
    this.lastStopWasDnf = false;
    this.showDnf = false;
    this.inspectionStartTime = null;
    this.inspectionElapsedMs = 0;
    this.inspectionPenalty = 'none';
  }
}
