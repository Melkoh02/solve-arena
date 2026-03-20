import { UserStore } from './userStore';
import { LanguageStore } from './languageStore.ts';
import { ThemeStore } from './themeStore.ts';
import { TimerStore } from './timerStore.ts';

export class RootStore {
  userStore: UserStore;
  languageStore: LanguageStore;
  themeStore: ThemeStore;
  timerStore: TimerStore;

  constructor() {
    this.userStore = new UserStore();
    this.languageStore = new LanguageStore();
    this.themeStore = new ThemeStore();
    this.timerStore = new TimerStore();
  }
}

const rootStore = new RootStore();
export default rootStore;
