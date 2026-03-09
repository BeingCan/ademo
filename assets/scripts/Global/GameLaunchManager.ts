import Singleton from "../Base/Singleton";
import { IState } from "../Common/State";

export enum GameLaunchMode {
  NewGame = "NewGame",
  ContinueGame = "ContinueGame",
}

export default class GameLaunchManager extends Singleton {
  static get Instance() {
    return super.GetInstance<GameLaunchManager>();
  }

  private launchMode: GameLaunchMode = GameLaunchMode.NewGame;
  private savedState: IState | null = null;

  setNewGame(): void {
    this.launchMode = GameLaunchMode.NewGame;
    this.savedState = null;
  }

  setContinueGame(state: IState): void {
    this.launchMode = GameLaunchMode.ContinueGame;
    this.savedState = state;
  }

  getLaunchMode(): GameLaunchMode {
    return this.launchMode;
  }

  getSavedState(): IState | null {
    return this.savedState;
  }

  clear(): void {
    this.launchMode = GameLaunchMode.NewGame;
    this.savedState = null;
  }
}
