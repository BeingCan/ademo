import {
  _decorator,
  Component,
  director,
  instantiate,
  Node,
  Prefab,
  SpriteFrame,
  Button,
} from "cc";
import DataManager from "../Global/DataManager";
import { JoyStickManager } from "../UI/JoyStickManager";
import { ScreenTouchManager } from "../UI/ScreenTouchManager";
import { InputManager } from "../UI/InputManager";
import { ResourceManager } from "../Global/ResourceManager";
import { ActorManager } from "../Entity/Actor/ActorManager";
import { BulletManager } from "../Entity/Bullet/BulletManager";
import { ObjectPoolManager } from "../Global/ObjectPoolManager";
import SettingsManager from "../Global/SettingsManager";
import SaveManager from "../Global/SaveManager";
import AudioManager from "../Global/AudioManager";
import {
  EntityTypeEnum,
  InputTypeEnum,
  PrefabPathEnum,
  TexturePathEnum,
  EventEnum,
  ControlModeEnum,
  SceneEnum,
  AudioPathEnum,
} from "../Common/Enum";
import EventManager from "../Global/EventManager";
const { ccclass, property } = _decorator;

@ccclass("BattleManager")
export class BattleManager extends Component {
  @property(Button)
  returnButton: Button | null = null;

  private stage: Node;
  private ui: Node;
  private shouldUpdate: boolean;
  private settingNode: Node | null = null;
  private settingButtonNode: Node | null = null;
  private joyStickNode: Node | null = null;
  private returnConfirmNode: Node | null = null;
  private isLoadingScene: boolean = false;
  private isPaused: boolean = false;

  onLoad() {}

  onDestroy() {
    InputManager.Instance.onDestroy();
    this.removeReturnButtonListener();
    this.removeSettingEventListeners();
  }

 async start() {
    this.clearGame();
    await this.loadRes();

    this.initGame();
  }

  async initGame() {
    DataManager.Instance.jm = this.ui.getComponentInChildren(JoyStickManager);
    if (DataManager.Instance.jm) {
      this.joyStickNode = DataManager.Instance.jm.node;
    }
    let stm = this.ui.getComponent(ScreenTouchManager);
    if (!stm) {
      stm = this.ui.addComponent(ScreenTouchManager);
    }
    InputManager.Instance.init();
    SettingsManager.Instance.init();
    AudioManager.Instance.init(this.node);
    await AudioManager.Instance.loadAllAudioClips();
    AudioManager.Instance.playBGM();
    this.initSettingButton();
    this.initMap();
    this.setupReturnButton();
    this.setupSettingEventListeners();
    this.updateJoyStickVisibility();
    this.shouldUpdate = true;
  }

  clearGame() {
    DataManager.Instance.stage = this.stage = this.node.getChildByName("Stage");
    this.ui = this.node.getChildByName("UI");
    this.stage.destroyAllChildren();
    
    this.isLoadingScene = false;
    this.isPaused = false;
    this.settingNode = null;
    this.settingButtonNode = null;
    this.returnConfirmNode = null;
    
    DataManager.Instance.actorMap.clear();
    DataManager.Instance.bulletMap.clear();
    DataManager.Instance.state = DataManager.Instance.getInitialState();
    ObjectPoolManager.Instance.reset();
    InputManager.Instance.reset();
  }

  async loadRes() {
    const list = [];
    for (const type in PrefabPathEnum) {
      const p = ResourceManager.Instance.loadRes(
        PrefabPathEnum[type],
        Prefab,
      ).then((prefab) => {
        DataManager.Instance.prefabMap.set(type, prefab);
      });
      list.push(p);
    }

    for (const type in TexturePathEnum) {
      const p = ResourceManager.Instance.loadDir(
        TexturePathEnum[type],
        SpriteFrame,
      ).then((spriteFrames) => {
        DataManager.Instance.textureMap.set(type, spriteFrames);
      });
      list.push(p);
    }

    await Promise.all(list);
  }

  initMap() {
    const prefab = DataManager.Instance.prefabMap.get(EntityTypeEnum.Bg);
    const map = instantiate(prefab);
    map.setParent(this.stage);
  }

  initSettingButton() {
    const prefab = DataManager.Instance.prefabMap.get(EntityTypeEnum.SettingButton);
    if (prefab) {
      this.settingButtonNode = instantiate(prefab);
      this.settingButtonNode.setParent(this.ui);
      this.settingButtonNode.active = true;
    }
  }

  setupReturnButton() {
    if (this.returnButton && this.returnButton.node) {
      this.returnButton.node.on("click", this.onReturnButtonClick, this);
    }
  }

  removeReturnButtonListener() {
    if (this.returnButton && this.returnButton.node) {
      this.returnButton.node.off("click", this.onReturnButtonClick, this);
    }
  }

  setupSettingEventListeners() {
    EventManager.Instance.on(EventEnum.OpenSetting, this.openSetting, this);
    EventManager.Instance.on(EventEnum.CloseSetting, this.closeSetting, this);
    EventManager.Instance.on(EventEnum.ControlModeChanged, this.updateJoyStickVisibility, this);
    EventManager.Instance.on(EventEnum.SaveAndReturn, this.onSaveAndReturn, this);
    EventManager.Instance.on(EventEnum.ReturnWithoutSave, this.onReturnWithoutSave, this);
    EventManager.Instance.on(EventEnum.CloseReturnConfirm, this.closeReturnConfirm, this);
    EventManager.Instance.on(EventEnum.WeaponShoot, this.playShootSound, this);
    EventManager.Instance.on(EventEnum.ExplosionBorn, this.playExplosionSound, this);
  }

  removeSettingEventListeners() {
    EventManager.Instance.off(EventEnum.OpenSetting, this.openSetting, this);
    EventManager.Instance.off(EventEnum.CloseSetting, this.closeSetting, this);
    EventManager.Instance.off(EventEnum.ControlModeChanged, this.updateJoyStickVisibility, this);
    EventManager.Instance.off(EventEnum.SaveAndReturn, this.onSaveAndReturn, this);
    EventManager.Instance.off(EventEnum.ReturnWithoutSave, this.onReturnWithoutSave, this);
    EventManager.Instance.off(EventEnum.CloseReturnConfirm, this.closeReturnConfirm, this);
    EventManager.Instance.off(EventEnum.WeaponShoot, this.playShootSound, this);
    EventManager.Instance.off(EventEnum.ExplosionBorn, this.playExplosionSound, this);
  }

  playShootSound() {
    AudioManager.Instance.playSFX(AudioPathEnum.Shoot);
  }

  playExplosionSound() {
    AudioManager.Instance.playSFX(AudioPathEnum.Explosion);
  }

  updateJoyStickVisibility() {
    if (this.joyStickNode) {
      const controlMode = SettingsManager.Instance.controlMode;
      this.joyStickNode.active = controlMode !== ControlModeEnum.Keyboard;
    }
  }

  openSetting() {
    this.isPaused = true;
    InputManager.Instance.isPaused = true;
    if (this.settingButtonNode) {
      this.settingButtonNode.active = true;
    }
    if (!this.settingNode) {
      const prefab = DataManager.Instance.prefabMap.get(EntityTypeEnum.Setting);
      if (prefab) {
        this.settingNode = instantiate(prefab);
        this.settingNode.setParent(this.ui);
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
    this.isPaused = false;
    InputManager.Instance.isPaused = false;
  }

  onReturnButtonClick() {
    this.openReturnConfirm();
  }

  openReturnConfirm() {
    this.isPaused = true;
    InputManager.Instance.isPaused = true;
    if (!this.returnConfirmNode) {
      const prefab = DataManager.Instance.prefabMap.get(EntityTypeEnum.ReturnConfirm);
      if (prefab) {
        this.returnConfirmNode = instantiate(prefab);
        this.returnConfirmNode.setParent(this.ui);
        this.returnConfirmNode.active = false;
      }
    }
    if (this.returnConfirmNode) {
      this.returnConfirmNode.active = true;
    }
  }

  closeReturnConfirm() {
    if (this.returnConfirmNode) {
      this.returnConfirmNode.active = false;
    }
    this.isPaused = false;
    InputManager.Instance.isPaused = false;
  }

  onSaveAndReturn() {
    SaveManager.Instance.saveGame(DataManager.Instance.state, SettingsManager.Instance.getSettings());
    this.returnToStartScene();
  }

  onReturnWithoutSave() {
    this.returnToStartScene();
  }

  returnToStartScene() {
    if (this.isLoadingScene) {
      return;
    }
    this.isLoadingScene = true;
    this.shouldUpdate = false;
    director.loadScene(SceneEnum.start);
  }

  update(dt) {
    if (!this.shouldUpdate || this.isPaused) {
      return;
    }
    this.render();
    this.tick(dt)
  }

  tick(dt){
    this.tickActor(dt)

    DataManager.Instance.applyInput({
      type: InputTypeEnum.TimePast,
      dt,
    })
  }

  tickActor(dt){
    for (const data of DataManager.Instance.state.actors) {
      const {id} = data
      let am = DataManager.Instance.actorMap.get(id)
      if (am) {
        am.tick(dt)
      }
    }
  }

  render() {
    this.renderActor();
    this.renderBullet();
  }

  renderActor() {
    for (const data of DataManager.Instance.state.actors) {
      const { id, type } = data;
      let am = DataManager.Instance.actorMap.get(id);
      if (!am) {
        const prefab = DataManager.Instance.prefabMap.get(type);
        const actor = instantiate(prefab);
        actor.setParent(this.stage);
        am = actor.addComponent(ActorManager);
        DataManager.Instance.actorMap.set(data.id, am);
        am.init(data);
      } else {
        am.render(data);
      }
    }
  }

  renderBullet() {
    for (const data of DataManager.Instance.state.bullets) {
      const { id, type } = data;
      let bm = DataManager.Instance.bulletMap.get(id);
      if (!bm) {
        const bullet = ObjectPoolManager.Instance.get(type);
        if (!bullet) {
          continue;
        }
        bm =
          bullet.getComponent(BulletManager) ||
          bullet.addComponent(BulletManager);
        DataManager.Instance.bulletMap.set(data.id, bm);
        bm.init(data);
      } else {
        bm.render(data);
      }
    }
  }
}
