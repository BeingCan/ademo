import { _decorator, Component, director, Node, Button, game, sys, Prefab, instantiate } from "cc";
import { EntityTypeEnum, SceneEnum, EventEnum, PrefabPathEnum } from "../Common/Enum";
import SaveManager from "../Global/SaveManager";
import GameLaunchManager from "../Global/GameLaunchManager";
import SettingsManager from "../Global/SettingsManager";
import AudioManager from "../Global/AudioManager";
import DataManager from "../Global/DataManager";
import EventManager from "../Global/EventManager";
import { ResourceManager } from "../Global/ResourceManager";
import { DEFAULT_GAME_STATE } from "../Common/DefaultState";
import { CHARACTER_ATTRIBUTES, WEAPON_CONFIGS } from "../Common/GameConstants";
const { ccclass, property } = _decorator;

@ccclass("StartManager")
export class StartManager extends Component {
  @property(Button) continueButton: Button | null = null;

  private isLoadingScene: boolean = false;
  private settingNode: Node | null = null;
  private settingButtonNode: Node | null = null;
  private characterSelectNode: Node | null = null;

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

    const prefabTypes = [
      EntityTypeEnum.Setting, 
      EntityTypeEnum.SettingButton, 
      EntityTypeEnum.CharacterSelect,
      EntityTypeEnum.Actor1,
      EntityTypeEnum.Actor2,
      EntityTypeEnum.Weapon1,
      EntityTypeEnum.Weapon2
    ];
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
    EventManager.Instance.on(EventEnum.CloseCharacterSelect, this.closeCharacterSelect, this);
    EventManager.Instance.on(EventEnum.StartGameWithSelection, this.startGameWithSelection, this);
  }

  removeEventListeners() {
    EventManager.Instance.off(EventEnum.OpenSetting, this.openSetting, this);
    EventManager.Instance.off(EventEnum.CloseSetting, this.closeSetting, this);
    EventManager.Instance.off(EventEnum.CloseCharacterSelect, this.closeCharacterSelect, this);
    EventManager.Instance.off(EventEnum.StartGameWithSelection, this.startGameWithSelection, this);
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
    this.openCharacterSelect();
  }

  openCharacterSelect() {
    if (!this.characterSelectNode) {
      const prefab = DataManager.Instance.prefabMap.get(EntityTypeEnum.CharacterSelect);
      if (prefab) {
        this.characterSelectNode = instantiate(prefab);
        this.characterSelectNode.setParent(this.node);
        this.characterSelectNode.active = false;
      }
    }
    if (this.characterSelectNode) {
      this.characterSelectNode.active = true;
    }
  }

  closeCharacterSelect() {
    if (this.characterSelectNode) {
      this.characterSelectNode.active = false;
    }
  }

  startGameWithSelection(characterType: EntityTypeEnum, weaponType: EntityTypeEnum, bulletType: EntityTypeEnum) {
    if (this.isLoadingScene) {
      return;
    }
    this.isLoadingScene = true;
    
    const newState = JSON.parse(JSON.stringify(DEFAULT_GAME_STATE));
    const characterAttr = CHARACTER_ATTRIBUTES[characterType as EntityTypeEnum.Actor1 | EntityTypeEnum.Actor2];
    const weapon1Config = WEAPON_CONFIGS[EntityTypeEnum.Weapon1];
    const weapon2Config = WEAPON_CONFIGS[EntityTypeEnum.Weapon2];
    
    newState.actors.push({
      id: 1,
      hp: characterAttr.hp,
      speed: characterAttr.speed,
      type: characterType,
      position: { x: 0, y: 0 },
      direction: { x: 1, y: 0 },
      weaponDirection: { x: 1, y: 0 },
      weaponType: weaponType,
      bulletType: bulletType,
      ammo: {
        [EntityTypeEnum.Weapon1]: weapon1Config.maxAmmo,
        [EntityTypeEnum.Weapon2]: weapon2Config.maxAmmo,
      },
    });
    
    GameLaunchManager.Instance.setNewGameWithState(newState);
    director.loadScene(SceneEnum.loading);
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
      director.loadScene(SceneEnum.loading);
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
