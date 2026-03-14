import {
  _decorator,
  Component,
  director,
  instantiate,
  Node,
  Prefab,
  SpriteFrame,
  Sprite,
  Button,
  Label,
  Vec2,
} from "cc";
import DataManager from "../Global/DataManager";
import { JoyStickManager } from "../UI/JoyStickManager";
import { ScreenTouchManager } from "../UI/ScreenTouchManager";
import { InputManager } from "../UI/InputManager";
import { EnemySpawnManager } from "../UI/EnemySpawnManager";
import { ResourceManager } from "../Global/ResourceManager";
import { ActorManager } from "../Entity/Actor/ActorManager";
import { BulletManager } from "../Entity/Bullet/BulletManager";
import { EnemyManager } from "../Entity/Enemy/EnemyManager";
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
  InventoryItemType,
} from "../Common/Enum";
import EventManager from "../Global/EventManager";
import { toFixed, randomBySeed } from "../Common/Utils";
import { ENEMY_CONFIGS, GAME_CONSTANTS, getWeaponConfig } from "../Common/GameConstants";
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
  private elixirSpeedBoostActive: boolean = false;
  private elixirSpeedBoostTimer: number = 0;
  private enemyDamageCooldown: number = 0;
  
  /** 事件监听器配置 */
  private eventListenerConfigs: Array<{
    event: EventEnum;
    handler: (...args: any[]) => void;
  }> = [];

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
    let screenTouchManager = this.ui.getComponent(ScreenTouchManager);
    if (!screenTouchManager) {
      screenTouchManager = this.ui.addComponent(ScreenTouchManager);
    }
    let enemySpawnManager = this.ui.getComponent(EnemySpawnManager);
    if (!enemySpawnManager) {
      enemySpawnManager = this.ui.addComponent(EnemySpawnManager);
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
    
    this.initInventory();
    
    EventManager.Instance.emit(EventEnum.UpdateWeaponDisplay);
    EventManager.Instance.emit(EventEnum.UpdateInventoryDisplay);
  }

  clearGame() {
    DataManager.Instance.stage = this.stage = this.node.getChildByName(GAME_CONSTANTS.NODE_NAMES.STAGE);
    this.ui = this.node.getChildByName(GAME_CONSTANTS.NODE_NAMES.UI);
    this.stage.destroyAllChildren();
    
    this.isLoadingScene = false;
    this.isPaused = false;
    this.settingNode = null;
    this.settingButtonNode = null;
    this.returnConfirmNode = null;
    this.elixirSpeedBoostActive = false;
    this.elixirSpeedBoostTimer = 0;
    this.enemyDamageCooldown = 0;
    
    DataManager.Instance.actorMap.clear();
    DataManager.Instance.bulletMap.clear();
    DataManager.Instance.enemyMap.clear();
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

  initInventory() {
    const prefab = DataManager.Instance.prefabMap.get(EntityTypeEnum.Inventory);
    if (prefab) {
      const inventoryNode = instantiate(prefab);
      inventoryNode.setParent(this.stage);
      inventoryNode.active = true;
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
    this.eventListenerConfigs = [
      { event: EventEnum.OpenSetting, handler: this.openSetting },
      { event: EventEnum.CloseSetting, handler: this.closeSetting },
      { event: EventEnum.ControlModeChanged, handler: this.updateJoyStickVisibility },
      { event: EventEnum.SaveAndReturn, handler: this.onSaveAndReturn },
      { event: EventEnum.ReturnWithoutSave, handler: this.onReturnWithoutSave },
      { event: EventEnum.CloseReturnConfirm, handler: this.closeReturnConfirm },
      { event: EventEnum.WeaponShoot, handler: this.playShootSound },
      { event: EventEnum.ExplosionBorn, handler: this.playExplosionSound },
      { event: EventEnum.SwitchWeapon, handler: this.onSwitchWeapon },
      { event: EventEnum.PickupInventoryItem, handler: this.onPickupInventoryItem },
    ];

    this.eventListenerConfigs.forEach(({ event, handler }) => {
      EventManager.Instance.on(event, handler, this);
    });
  }

  removeSettingEventListeners() {
    this.eventListenerConfigs.forEach(({ event, handler }) => {
      EventManager.Instance.off(event, handler, this);
    });
    this.eventListenerConfigs = [];
  }

  playShootSound() {
    AudioManager.Instance.playSFX(AudioPathEnum.Shoot);
  }

  playExplosionSound() {
    AudioManager.Instance.playSFX(AudioPathEnum.Explosion);
  }

  onPickupInventoryItem(itemType: InventoryItemType) {
    if (itemType === InventoryItemType.Ammo) {
      DataManager.Instance.state.inventory.ammo++;
    } else if (itemType === InventoryItemType.HealthPack) {
      DataManager.Instance.state.inventory.healthPack++;
    } else if (itemType === InventoryItemType.Elixir) {
      DataManager.Instance.state.inventory.elixir++;
    }
    
    EventManager.Instance.emit(EventEnum.UpdateInventoryDisplay);
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
    this.toggleEnemySpawn(false);
    
    this.settingNode = this.getOrCreateUINode(EntityTypeEnum.Setting, this.settingNode);
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
    this.toggleEnemySpawn(true);
  }

  onReturnButtonClick() {
    this.openReturnConfirm();
  }

  openReturnConfirm() {
    this.isPaused = true;
    InputManager.Instance.isPaused = true;
    this.toggleEnemySpawn(false);
    
    this.returnConfirmNode = this.getOrCreateUINode(EntityTypeEnum.ReturnConfirm, this.returnConfirmNode);
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
    this.toggleEnemySpawn(true);
  }

  /**
   * 获取或创建 UI 节点
   * @param entityType 实体类型
   * @param nodeRef 节点引用
   * @returns UI 节点
   */
  private getOrCreateUINode(entityType: EntityTypeEnum, nodeRef: Node | null): Node {
    if (nodeRef) {
      return nodeRef;
    }

    const prefab = DataManager.Instance.prefabMap.get(entityType);
    if (!prefab) {
      console.warn(`Prefab not found: ${entityType}`);
      return null;
    }

    const node = instantiate(prefab);
    node.setParent(this.ui);
    node.active = false;
    return node;
  }

  /**
   * 控制敌人生成
   * @param shouldSpawn 是否生成
   */
  private toggleEnemySpawn(shouldSpawn: boolean) {
    const enemySpawnManager = this.node.getComponentInChildren(EnemySpawnManager);
    if (enemySpawnManager) {
      (enemySpawnManager as any).shouldSpawn = shouldSpawn;
    }
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

  onSwitchWeapon() {
    const actor = DataManager.Instance.state.actors.find(a => a.id === DataManager.Instance.myPlayerId);
    if (!actor) {
      return;
    }

    const currentWeaponType = actor.weaponType;
    const newWeaponType = currentWeaponType === EntityTypeEnum.Weapon2 ? EntityTypeEnum.Weapon1 : EntityTypeEnum.Weapon2;
    const newBulletType = newWeaponType === EntityTypeEnum.Weapon1 ? EntityTypeEnum.Bullet1 : EntityTypeEnum.Bullet2;
    
    if (newWeaponType === currentWeaponType) {
      return;
    }

    actor.weaponType = newWeaponType;
    actor.bulletType = newBulletType;

    const actorManager = DataManager.Instance.actorMap.get(actor.id);
    if (actorManager) {
      actorManager.switchWeapon(newWeaponType, newBulletType);
    }

    EventManager.Instance.emit(EventEnum.UpdateWeaponDisplay);
  }

  update(dt) {
    if (!this.shouldUpdate || this.isPaused) {
      return;
    }
    this.tick(dt);
    this.render();
  }

  tick(dt){
    this.tickElixirSpeedBoost(dt);
    this.tickEnemyDamageCooldown(dt);
    this.tickActor(dt);
    this.tickEnemy(dt);
    this.checkCollisions();
    this.checkGameOver();

    DataManager.Instance.applyInput({
      type: InputTypeEnum.TimePast,
      dt,
    });
  }

  tickEnemyDamageCooldown(dt: number) {
    if (this.enemyDamageCooldown > 0) {
      this.enemyDamageCooldown -= dt;
      if (this.enemyDamageCooldown < 0) {
        this.enemyDamageCooldown = 0;
      }
    }
  }

  checkGameOver() {
    const player = DataManager.Instance.state.actors.find(a => a.id === DataManager.Instance.myPlayerId);
    if (!player) {
      return;
    }
    if (player.hp <= 0 && !this.isPaused) {
      this.openReturnConfirm();
    }
  }

  tickElixirSpeedBoost(dt: number) {
    if (this.elixirSpeedBoostActive) {
      this.elixirSpeedBoostTimer -= dt;
      if (this.elixirSpeedBoostTimer <= 0) {
        this.elixirSpeedBoostActive = false;
        this.elixirSpeedBoostTimer = 0;
      }
    }
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
      } else if (am.node && am.node.isValid) {
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
      } else if (bm.node && bm.node.isValid) {
        bm.render(data);
      }
    }
  }

  renderEnemy() {
    for (const data of DataManager.Instance.state.enemies) {
      const { id, type } = data;
      let em = DataManager.Instance.enemyMap.get(id);
      if (!em) {
        const enemyNode = ObjectPoolManager.Instance.get(type);
        if (!enemyNode) {
          continue;
        }
        enemyNode.setParent(this.stage);
        em = enemyNode.getComponent(EnemyManager) || enemyNode.addComponent(EnemyManager);
        DataManager.Instance.enemyMap.set(data.id, em);
        em.init(data);
      } else if (em.node && em.node.isValid) {
        em.render(data);
      }
    }
  }

  render() {
    this.renderActor();
    this.renderBullet();
    this.renderEnemy();
  }

  tickEnemy(dt: number){
    const player = DataManager.Instance.state.actors.find(a => a.id === DataManager.Instance.myPlayerId);
    if (!player || !player.position) {
      return;
    }

    for (const enemy of DataManager.Instance.state.enemies) {
      if (!enemy.position) {
        continue;
      }

      const dx = player.position.x - enemy.position.x;
      const dy = player.position.y - enemy.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        enemy.direction = { x: dirX, y: dirY };
        enemy.position.x += dirX * enemy.speed * dt;
        enemy.position.y += dirY * enemy.speed * dt;
      }
    }
  }

  /**
   * 检测所有碰撞
   * 包括敌人-角色碰撞和子弹-敌人碰撞
   */
  checkCollisions() {
    this.checkEnemyActorCollisions();
    this.checkBulletEnemyCollisions();
  }

  /**
   * 检测敌人与角色的碰撞
   * 当敌人靠近玩家时造成伤害
   */
  checkEnemyActorCollisions() {
    const player = DataManager.Instance.state.actors.find(a => a.id === DataManager.Instance.myPlayerId);
    if (!player || !player.position) {
      return;
    }

    for (const enemy of [...DataManager.Instance.state.enemies]) {
      if (!enemy.position) {
        continue;
      }

      const dx = player.position.x - enemy.position.x;
      const dy = player.position.y - enemy.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < GAME_CONSTANTS.DISTANCE.ENEMY_ACTOR_COLLISION && this.enemyDamageCooldown <= 0) {
        player.hp -= enemy.damage;
        this.enemyDamageCooldown = GAME_CONSTANTS.COMBAT.ENEMY_DAMAGE_COOLDOWN;
      }
    }
  }

  /**
   * 检测子弹与敌人的碰撞
   * 包含暴击机制和伤害计算
   */
  checkBulletEnemyCollisions() {
    for (const bullet of [...DataManager.Instance.state.bullets]) {
      if (!bullet.position) {
        continue;
      }

      let bulletHit = false;

      for (const enemy of [...DataManager.Instance.state.enemies]) {
        if (!enemy.position) {
          continue;
        }

        const dx = bullet.position.x - enemy.position.x;
        const dy = bullet.position.y - enemy.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < GAME_CONSTANTS.DISTANCE.BULLET_ENEMY_COLLISION && !bulletHit) {
          bulletHit = true;

          EventManager.Instance.emit(EventEnum.ExplosionBorn, bullet.id, {
            x: toFixed((bullet.position.x + enemy.position.x) / 2),
            y: toFixed((bullet.position.y + enemy.position.y) / 2),
          });

          const config = ENEMY_CONFIGS[enemy.type as EntityTypeEnum.Enemy1 | EntityTypeEnum.Enemy2 | EntityTypeEnum.Enemy3];
          const weaponConfig = getWeaponConfig(bullet.weaponType);
          const baseDamage = GAME_CONSTANTS.BASE_BULLET_DAMAGE * weaponConfig.damageMultiplier;
          
          // 使用随机数种子判断是否暴击（50% 概率）
          const random = randomBySeed(DataManager.Instance.state.seed);
          DataManager.Instance.state.seed = random;
          const isCritical = random / GAME_CONSTANTS.COMBAT.RANDOM_SEED_DIVISOR >= GAME_CONSTANTS.COMBAT.CRITICAL_CHANCE_THRESHOLD;
          const damage = isCritical ? baseDamage * GAME_CONSTANTS.COMBAT.CRITICAL_DAMAGE_MULTIPLIER : baseDamage;
          
          enemy.hp -= damage;

          if (enemy.hp <= 0) {
            const em = DataManager.Instance.enemyMap.get(enemy.id);
            if (em) {
              em.die();
            }
          }
        }

        if (bulletHit) {
          break;
        }
      }

      if (bulletHit) {
        const bulletIndex = DataManager.Instance.state.bullets.findIndex(b => b.id === bullet.id);
        if (bulletIndex > -1) {
          DataManager.Instance.state.bullets.splice(bulletIndex, 1);
        }
      }
    }
  }

}
