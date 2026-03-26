import { makeAutoObservable, runInAction } from 'mobx';
import axios from 'axios';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const PING_INTERVAL = 4 * 60 * 1000; // Keep alive every 4 minutes

export type ServerStatus = 'offline' | 'waking' | 'online';

export class ServerStore {
  status: ServerStatus = 'offline';
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    makeAutoObservable(this);
    this.warmUp();
  }

  async warmUp() {
    if (this.status === 'waking') return;
    runInAction(() => {
      this.status = 'waking';
    });

    try {
      await axios.get(`${SOCKET_URL}/api/health`, { timeout: 60000 });
      runInAction(() => {
        this.status = 'online';
      });
      this.startKeepAlive();
    } catch {
      runInAction(() => {
        this.status = 'offline';
      });
    }
  }

  private startKeepAlive() {
    if (this.pingTimer) return;
    this.pingTimer = setInterval(async () => {
      try {
        await axios.get(`${SOCKET_URL}/api/health`, { timeout: 10000 });
        runInAction(() => {
          this.status = 'online';
        });
      } catch {
        runInAction(() => {
          this.status = 'offline';
        });
      }
    }, PING_INTERVAL);
  }
}
