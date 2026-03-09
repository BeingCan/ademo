import { sys } from "cc";
import Singleton from "../Base/Singleton";
import { IState } from "../Common/State";
import { ISettings } from "./SettingsManager";

const SAVE_KEY = "game_save_data";

interface ISaveData {
  state: IState;
  settings: ISettings;
}

export default class SaveManager extends Singleton {
  static get Instance() {
    return super.GetInstance<SaveManager>();
  }

  saveGame(state: IState, settings: ISettings): boolean {
    try {
      const saveData: ISaveData = {
        state,
        settings
      };
      sys.localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch (error) {
      console.error("Failed to save game:", error);
      return false;
    }
  }

  loadGame(): { state: IState | null; settings: ISettings | null } {
    try {
      const saveData = sys.localStorage.getItem(SAVE_KEY);
      if (saveData) {
        const parsed = JSON.parse(saveData);
        if (parsed.state && parsed.settings) {
          return {
            state: parsed.state as IState,
            settings: parsed.settings as ISettings
          };
        } else if (parsed.state) {
          return {
            state: parsed.state as IState,
            settings: null
          };
        }
      }
      return { state: null, settings: null };
    } catch (error) {
      console.error("Failed to load game:", error);
      return { state: null, settings: null };
    }
  }

  hasSaveData(): boolean {
    return sys.localStorage.getItem(SAVE_KEY) !== null;
  }

  clearSave(): void {
    sys.localStorage.removeItem(SAVE_KEY);
  }
}
