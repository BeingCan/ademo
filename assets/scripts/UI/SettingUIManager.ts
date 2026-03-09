import {
  _decorator,
  Component,
  Slider,
  Toggle,
  Button,
  Label,
} from "cc";
import SettingsManager, { ISettings } from "../Global/SettingsManager";
import EventManager from "../Global/EventManager";
import { EventEnum, ControlModeEnum } from "../Common/Enum";
const { ccclass, property } = _decorator;

@ccclass("SettingUIManager")
export class SettingUIManager extends Component {
  @property(Slider)
  musicSlider: Slider | null = null;

  @property(Slider)
  soundSlider: Slider | null = null;

  @property(Toggle)
  joystickToggle: Toggle | null = null;

  @property(Toggle)
  keyboardToggle: Toggle | null = null;

  @property(Button)
  closeButton: Button | null = null;

  @property(Button)
  resetButton: Button | null = null;

  @property(Button)
  saveSettingButton: Button | null = null;

  @property(Label)
  musicVolumeLabel: Label | null = null;

  @property(Label)
  soundVolumeLabel: Label | null = null;

  private tempSettings: ISettings | null = null;
  private originalSettings: ISettings | null = null;

  onLoad() {
    this.setupEventListeners();
    this.loadSettingsToUI();
  }

  onDestroy() {
    this.removeEventListeners();
    this.restoreOriginalSettings();
  }

  private setupEventListeners() {
    if (this.musicSlider && this.musicSlider.node) {
      this.musicSlider.node.on(
        "slide",
        this.onMusicVolumeChanged,
        this
      );
    }

    if (this.soundSlider && this.soundSlider.node) {
      this.soundSlider.node.on(
        "slide",
        this.onSoundVolumeChanged,
        this
      );
    }

    if (this.joystickToggle && this.joystickToggle.node) {
      this.joystickToggle.node.on(
        "toggle",
        this.onControlModeChanged,
        this
      );
    }

    if (this.keyboardToggle && this.keyboardToggle.node) {
      this.keyboardToggle.node.on(
        "toggle",
        this.onControlModeChanged,
        this
      );
    }

    if (this.closeButton && this.closeButton.node) {
      this.closeButton.node.on("click", this.closeSetting, this);
    }

    if (this.resetButton && this.resetButton.node) {
      this.resetButton.node.on("click", this.resetSettings, this);
    }

    if (this.saveSettingButton && this.saveSettingButton.node) {
      this.saveSettingButton.node.on("click", this.saveSettings, this);
    }
  }

  private removeEventListeners() {
    if (this.musicSlider && this.musicSlider.node) {
      this.musicSlider.node.off(
        "slide",
        this.onMusicVolumeChanged,
        this
      );
    }

    if (this.soundSlider && this.soundSlider.node) {
      this.soundSlider.node.off(
        "slide",
        this.onSoundVolumeChanged,
        this
      );
    }

    if (this.joystickToggle && this.joystickToggle.node) {
      this.joystickToggle.node.off(
        "toggle",
        this.onControlModeChanged,
        this
      );
    }

    if (this.keyboardToggle && this.keyboardToggle.node) {
      this.keyboardToggle.node.off(
        "toggle",
        this.onControlModeChanged,
        this
      );
    }

    if (this.closeButton && this.closeButton.node) {
      this.closeButton.node.off("click", this.closeSetting, this);
    }

    if (this.resetButton && this.resetButton.node) {
      this.resetButton.node.off("click", this.resetSettings, this);
    }

    if (this.saveSettingButton && this.saveSettingButton.node) {
      this.saveSettingButton.node.off("click", this.saveSettings, this);
    }
  }

  private loadSettingsToUI() {
    const settings = SettingsManager.Instance;
    this.originalSettings = settings.getSettings();
    this.tempSettings = { ...this.originalSettings };

    if (this.musicSlider) {
      this.musicSlider.progress = this.tempSettings.musicVolume;
    }
    this.updateMusicVolumeLabel(this.tempSettings.musicVolume);

    if (this.soundSlider) {
      this.soundSlider.progress = this.tempSettings.soundVolume;
    }
    this.updateSoundVolumeLabel(this.tempSettings.soundVolume);

    this.updateControlModeToggle(this.tempSettings.controlMode);
  }

  private onMusicVolumeChanged(slider: Slider) {
    const volume = slider.progress;
    if (this.tempSettings) {
      this.tempSettings.musicVolume = volume;
    }
    this.updateMusicVolumeLabel(volume);
    SettingsManager.Instance.musicVolume = volume;
  }

  private onSoundVolumeChanged(slider: Slider) {
    const volume = slider.progress;
    if (this.tempSettings) {
      this.tempSettings.soundVolume = volume;
    }
    this.updateSoundVolumeLabel(volume);
    SettingsManager.Instance.soundVolume = volume;
  }

  private onControlModeChanged(toggle: Toggle) {
    if (this.tempSettings) {
      if (toggle === this.joystickToggle && toggle.isChecked) {
        this.tempSettings.controlMode = ControlModeEnum.Joystick;
      } else if (toggle === this.keyboardToggle && toggle.isChecked) {
        this.tempSettings.controlMode = ControlModeEnum.Keyboard;
      }
    }
  }

  private updateControlModeToggle(mode: ControlModeEnum) {
    if (this.joystickToggle) {
      this.joystickToggle.isChecked = mode === ControlModeEnum.Joystick;
    }
    if (this.keyboardToggle) {
      this.keyboardToggle.isChecked = mode === ControlModeEnum.Keyboard;
    }
  }

  private updateMusicVolumeLabel(volume: number) {
    if (this.musicVolumeLabel) {
      this.musicVolumeLabel.string = `${Math.round(volume * 100)}%`;
    }
  }

  private updateSoundVolumeLabel(volume: number) {
    if (this.soundVolumeLabel) {
      this.soundVolumeLabel.string = `${Math.round(volume * 100)}%`;
    }
  }

  private resetSettings() {
    const defaultSettings: ISettings = {
      musicVolume: 1,
      soundVolume: 1,
      controlMode: ControlModeEnum.Joystick,
    };
    this.tempSettings = { ...defaultSettings };
    
    if (this.musicSlider) {
      this.musicSlider.progress = this.tempSettings.musicVolume;
    }
    this.updateMusicVolumeLabel(this.tempSettings.musicVolume);
    SettingsManager.Instance.musicVolume = this.tempSettings.musicVolume;

    if (this.soundSlider) {
      this.soundSlider.progress = this.tempSettings.soundVolume;
    }
    this.updateSoundVolumeLabel(this.tempSettings.soundVolume);
    SettingsManager.Instance.soundVolume = this.tempSettings.soundVolume;

    this.updateControlModeToggle(this.tempSettings.controlMode);
  }

  private saveSettings() {
    if (this.tempSettings) {
      SettingsManager.Instance.setSettings(this.tempSettings);
      SettingsManager.Instance.saveSettings();
      this.originalSettings = { ...this.tempSettings };
      EventManager.Instance.emit(EventEnum.ControlModeChanged);
    }
  }

  private restoreOriginalSettings() {
    if (this.originalSettings) {
      SettingsManager.Instance.setSettings(this.originalSettings);
    }
  }

  closeSetting() {
    EventManager.Instance.emit(EventEnum.CloseSetting);
  }
}
