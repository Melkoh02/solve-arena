import { UserStore } from './userStore';
import { LanguageStore } from './languageStore.ts';
import { ThemeStore } from './themeStore.ts';
import { TimerStore } from './timerStore.ts';
import { RoomStore } from './roomStore.ts';

export class RootStore {
  userStore: UserStore;
  languageStore: LanguageStore;
  themeStore: ThemeStore;
  timerStore: TimerStore;
  roomStore: RoomStore;

  constructor() {
    this.userStore = new UserStore();
    this.languageStore = new LanguageStore();
    this.themeStore = new ThemeStore();
    this.timerStore = new TimerStore();
    this.roomStore = new RoomStore();
  }
}

const rootStore = new RootStore();
export default rootStore;
