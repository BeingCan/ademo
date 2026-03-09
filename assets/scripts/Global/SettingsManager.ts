import Singleton from "../Base/Singleton";
import { ControlModeEnum } from "../Common/Enum";
import AudioManager from "./AudioManager";

export interface ISettings {
  musicVolume: number;
  soundVolume: number;
  controlMode: ControlModeEnum;
}

export default class SettingsManager extends Singleton {
  static get Instance() {
    return super.GetInstance<SettingsManager>();
  }

  private settings: ISettings = {
    musicVolume: 1,
    soundVolume: 1,
    controlMode: ControlModeEnum.Joystick,
  };

  private readonly STORAGE_KEY = "game_settings";
  private isInitialized: boolean = false;

  init() {
    if (this.isInitialized) {
      return;
    }
    this.loadSettings();
    this.isInitialized = true;
  }

  getSettings(): ISettings {
    return { ...this.settings };
  }

  setSettings(settings: ISettings) {
    this.settings = { ...settings };
  }

  get musicVolume(): number {
    return this.settings.musicVolume;
  }

  set musicVolume(value: number) {
    this.settings.musicVolume = Math.max(0, Math.min(1, value));
    AudioManager.Instance.updateMusicVolume();
  }

  get soundVolume(): number {
    return this.settings.soundVolume;
  }

  set soundVolume(value: number) {
    this.settings.soundVolume = Math.max(0, Math.min(1, value));
    AudioManager.Instance.updateSoundVolume();
  }

  get controlMode(): ControlModeEnum {
    return this.settings.controlMode;
  }

  set controlMode(value: ControlModeEnum) {
    this.settings.controlMode = value;
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
      }
    } catch (e) {
      console.warn("Failed to load settings:", e);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn("Failed to save settings:", e);
    }
  }

  resetToDefault() {
    this.settings = {
      musicVolume: 1,
      soundVolume: 1,
      controlMode: ControlModeEnum.Joystick,
    };
  }
}
