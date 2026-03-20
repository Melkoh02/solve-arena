import {action, computed, makeAutoObservable, runInAction} from 'mobx';
import type {User} from '../types/user';
import {USER_STORAGE_KEY} from '../constants';

interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export class UserStore {
  user: User | null = null;
  accessToken: string | null = null;
  refreshToken: string | null = null;
  isHydrated = false;

  constructor() {
    makeAutoObservable(this, {
      authHeader: computed,
      setAuth: action.bound,
      logout: action.bound,
    });
    this.hydrate();
  }

  /** Computed helper that builds the Authorization header. */
  get authHeader(): {Authorization?: string} {
    return this.accessToken
      ? {Authorization: `Bearer ${this.accessToken}`}
      : {};
  }

  /** Populate the store with tokens and user data returned from login. */
  setAuth({access, refresh, user}: AuthResponse) {
    this.accessToken = access;
    this.refreshToken = refresh;
    this.user = user;
    try {
      localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify({access, refresh, user}),
      );
    } catch (e) {
      console.warn('Failed to persist auth to localStorage', e);
    }
  }

  /** Clears all authentication and user data. */
  logout() {
    this.user = null;
    this.accessToken = null;
    this.refreshToken = null;
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to remove auth from localStorage', e);
    }
  }

  /** Load saved auth from localStorage */
  private async hydrate() {
    try {
      const json = localStorage.getItem(USER_STORAGE_KEY);
      if (json) {
        const {access, refresh, user}: AuthResponse = JSON.parse(json);
        runInAction(() => {
          this.accessToken = access;
          this.refreshToken = refresh;
          this.user = user;
        });
      }
    } catch (e) {
      console.warn('UserStore hydration failed', e);
    } finally {
      runInAction(() => {
        this.isHydrated = true;
      });
    }
  }
}
