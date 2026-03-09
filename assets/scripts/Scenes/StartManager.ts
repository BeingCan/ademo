import { _decorator, Component, director, Node, Button, game, sys, Prefab, instantiate } from "cc";
import { EntityTypeEnum, SceneEnum, EventEnum, PrefabPathEnum } from "../Common/Enum";
import SaveManager from "../Global/SaveManager";
import GameLaunchManager from "../Global/GameLaunchManager";
import SettingsManager from "../Global/SettingsManager";
import AudioManager from "../Global/AudioManager";
import DataManager from "../Global/DataManager";
import EventManager from "../Global/EventManager";
import { ResourceManager } from "../Global/ResourceManager";
const { ccclass, property } = _decorator;

@ccclass("StartManager")
export class StartManager extends Component {
  @property(Button) continueButton: Button | null = null;

  private isLoadingScene: boolean = false;
  private settingNode: Node | null = null;
  private settingButtonNode: Node | null = null;

  async onLoad() {
    this.updateContinueButtonState();
    SettingsManager.Instance.init();
    AudioManager.Instance.init(this.node);
    await AudioManager.Instance.loadAllAudioClips();
    AudioManager.Instance.playBGM();
    await this.loadRes();
    this.initSettingButton();
    this.setupEventListeners();
  }

  onDestroy() {
    this.removeEventListeners();
  }

  async loadRes() {
    const list = [];

    const prefabTypes = [EntityTypeEnum.Setting, EntityTypeEnum.SettingButton];
    for (const type of prefabTypes) {
      const p = ResourceManager.Instance.loadRes(
        PrefabPathEnum[type],
        Prefab,
      ).then((prefab) => {
        DataManager.Instance.prefabMap.set(type, prefab);
      });
      list.push(p);
    }

    await Promise.all(list);
  }

  initSettingButton() {
    const prefab = DataManager.Instance.prefabMap.get(EntityTypeEnum.SettingButton);
    if (prefab) {
      this.settingButtonNode = instantiate(prefab);
      this.settingButtonNode.setParent(this.node);
      this.settingButtonNode.active = true;
    }
  }

  setupEventListeners() {
    EventManager.Instance.on(EventEnum.OpenSetting, this.openSetting, this);
    EventManager.Instance.on(EventEnum.CloseSetting, this.closeSetting, this);
  }

  removeEventListeners() {
    EventManager.Instance.off(EventEnum.OpenSetting, this.openSetting, this);
    EventManager.Instance.off(EventEnum.CloseSetting, this.closeSetting, this);
  }

  openSetting() {
    if (!this.settingNode) {
      const prefab = DataManager.Instance.prefabMap.get(EntityTypeEnum.Setting);
      if (prefab) {
        this.settingNode = instantiate(prefab);
        this.settingNode.setParent(this.node);
        this.settingNode.active = false;
      }
    }
    if (this.settingNode) {
      this.settingNode.active = true;
    }
  }

  closeSetting() {
    if (this.settingNode) {
      this.settingNode.active = false;
    }
  }

  handleNewGame() {
    if (this.isLoadingScene) {
      return;
    }
    this.isLoadingScene = true;
    GameLaunchManager.Instance.setNewGame();
    director.loadScene(SceneEnum.battle);
  }

  handleContinueGame() {
    if (this.isLoadingScene) {
      return;
    }
    this.isLoadingScene = true;
    const { state, settings } = SaveManager.Instance.loadGame();
    if (state) {
      GameLaunchManager.Instance.setContinueGame(state);
      if (settings) {
        SettingsManager.Instance.setSettings(settings);
      }
      director.loadScene(SceneEnum.battle);
    } else {
      this.isLoadingScene = false;
    }
  }

  handleQuitGame() {
    if (sys.isNative) {
      game.end();
    } else {
      if (window && window.close) {
        window.close();
      } else {
        console.log("浏览器环境下无法直接关闭页面，请手动关闭标签页");
      }
    }
  }

  private updateContinueButtonState() {
    if (this.continueButton) {
      this.continueButton.interactable = SaveManager.Instance.hasSaveData();
    }
  }
}
