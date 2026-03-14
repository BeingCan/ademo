import {
  _decorator,
  Component,
  instantiate,
  ProgressBar,
  Vec2,
  Vec3,
  view,
} from "cc";
import { EntityManager } from "../../Base/EntityManager";
import { WeaponManager } from "../Weapon/WeaponManager";
import {
  EntityStateEnum,
  EntityTypeEnum,
  EventEnum,
  InputTypeEnum,
  ControlModeEnum,
  AudioPathEnum,
  InventoryItemType,
} from "../../Common/Enum";
import { IActor, IInventory } from "../../Common/State";
import { radToAngle } from "../../Common/Utils";
import { ActorStateMachine } from "./ActorStateMachine";
import { CHARACTER_ATTRIBUTES, GAME_CONSTANTS, getWeaponConfig, WEAPON_ATTRIBUTES } from "../../Common/GameConstants";
import DataManager from "../../Global/DataManager";
import EventManager from "../../Global/EventManager";
import { InputManager } from "../../UI/InputManager";
import SettingsManager from "../../Global/SettingsManager";
import AudioManager from "../../Global/AudioManager";
const { ccclass, property } = _decorator;

@ccclass("ActorManager")
export class ActorManager extends EntityManager {
  id: number;
  bulletType: EntityTypeEnum;
  initialMaxHP: number = 0;
  initialSpeed: number = 0;
  speedBoostTimer: number = 0;
  speedBoostActive: boolean = false;

  private wm: WeaponManager;
  private hp: ProgressBar;
  private targetMovePos: Vec2 | null = null;
  private lastFireTime: number = 0;
  private weaponType: EntityTypeEnum;

  tick(dt: number): void {
    if (!this.fsm || this.id !== DataManager.Instance.myPlayerId) {
      return;
    }

    this.lastFireTime += dt;
    this.tickSpeedBoost(dt);
    
    const moveInput = this.handleMoveInput();
    this.applyMovement(moveInput, dt);
    this.handleShootInput();
  }

  /**
   * 更新速度提升状态
   * @param dt - 时间增量（秒）
   */
  private tickSpeedBoost(dt: number): void {
    if (this.speedBoostActive) {
      this.speedBoostTimer -= dt;
      if (this.speedBoostTimer <= 0) {
        this.speedBoostActive = false;
        this.speedBoostTimer = 0;
        const actor = DataManager.Instance.state.actors.find(a => a.id === this.id);
        if (actor) {
          const characterAttr = CHARACTER_ATTRIBUTES[actor.type as EntityTypeEnum.Actor1 | EntityTypeEnum.Actor2];
          actor.speed = characterAttr.speed;
        }
      }
    }
  }

  /**
   * 处理移动输入并返回移动向量
   * @returns 移动向量
   */
  private handleMoveInput(): Vec2 {
    let moveInput = Vec2.ZERO.clone();
    const controlMode = SettingsManager.Instance.controlMode;
    const actor = DataManager.Instance.state.actors.find(a => a.id === DataManager.Instance.myPlayerId);

    if (controlMode === ControlModeEnum.Keyboard) {
      this.handleKeyboardMoveInput(actor);
      moveInput = this.calculateMoveToTarget(actor);
    }

    if (controlMode === ControlModeEnum.Joystick) {
      moveInput = this.handleJoystickMoveInput(moveInput);
    }

    return moveInput;
  }

  /**
   * 处理键盘模式的移动输入（右键点击设置目标）
   * @param actor - 角色数据
   */
  private handleKeyboardMoveInput(actor: IActor | undefined): void {
    if (!actor || !actor.position) return;
    
    const rightClickPos = InputManager.Instance.consumeRightClickPos();
    if (rightClickPos) {
      const visibleSize = view.getVisibleSize();
      const worldTouchX = rightClickPos.x - visibleSize.width / 2;
      const worldTouchY = rightClickPos.y - visibleSize.height / 2;
      this.targetMovePos = new Vec2(worldTouchX, worldTouchY);
    }
  }

  /**
   * 计算向目标位置移动的向量
   * @param actor - 角色数据
   * @returns 移动向量
   */
  private calculateMoveToTarget(actor: IActor | undefined): Vec2 {
    const moveInput = Vec2.ZERO.clone();
    if (!this.targetMovePos || !actor || !actor.position) {
      return moveInput;
    }

    const dirX = this.targetMovePos.x - actor.position.x;
    const dirY = this.targetMovePos.y - actor.position.y;
    const distance = Math.sqrt(dirX ** 2 + dirY ** 2);
    
    if (distance > GAME_CONSTANTS.DISTANCE.TARGET_REACHED) {
      const dir = new Vec2(dirX, dirY);
      dir.normalize();
      moveInput.set(dir.x, dir.y);
    } else {
      this.targetMovePos = null;
    }

    return moveInput;
  }

  /**
   * 处理摇杆模式的移动输入
   * @param currentInput - 当前移动输入
   * @returns 更新后的移动输入
   */
  private handleJoystickMoveInput(currentInput: Vec2): Vec2 {
    if (DataManager.Instance.jm && DataManager.Instance.jm.input.length() > 0 && currentInput.length() === 0) {
      const newInput = currentInput.clone();
      newInput.set(DataManager.Instance.jm.input.x, DataManager.Instance.jm.input.y);
      this.targetMovePos = null;
      return newInput;
    }
    return currentInput;
  }

  /**
   * 应用移动输入
   * @param moveInput - 移动向量
   * @param dt - 时间增量（秒）
   */
  private applyMovement(moveInput: Vec2, dt: number): void {
    if (moveInput.length() > 0) {
      const { x, y } = moveInput;
      DataManager.Instance.applyInput({
        id: 1,
        type: InputTypeEnum.ActorMove,
        direction: { x, y },
        dt,
      });
      this.state = EntityStateEnum.Run;
    } else {
      this.state = EntityStateEnum.Idle;
    }
  }

  /**
   * 处理射击输入
   */
  private handleShootInput(): void {
    const controlMode = SettingsManager.Instance.controlMode;
    if (controlMode !== ControlModeEnum.Keyboard) {
      return;
    }

    const actor = DataManager.Instance.state.actors.find(a => a.id === DataManager.Instance.myPlayerId);
    if (!actor || !actor.position) {
      return;
    }

    const leftClickPos = InputManager.Instance.consumeLeftClickPos();
    if (!leftClickPos) {
      return;
    }

    const visibleSize = view.getVisibleSize();
    const worldTouchX = leftClickPos.x - visibleSize.width / 2;
    const worldTouchY = leftClickPos.y - visibleSize.height / 2;
    
    const dirX = worldTouchX - actor.position.x;
    const dirY = worldTouchY - actor.position.y;
    const dir = new Vec2(dirX, dirY);
    
    if (dir.length() > 0) {
      dir.normalize();
      EventManager.Instance.emit(EventEnum.WeaponRotate, dir.x, dir.y);
      this.shootAtDirection(dir);
    }
  }

  private shootAtDirection(direction: Vec2): void {
    const actor = DataManager.Instance.state.actors.find(a => a.id === DataManager.Instance.myPlayerId);
    if (!actor || !actor.position) {
      return;
    }

    const config = getWeaponConfig(this.weaponType);
    
    if (this.lastFireTime < config.fireRate) {
      return;
    }
    
    if (actor.ammo[this.weaponType as EntityTypeEnum.Weapon1 | EntityTypeEnum.Weapon2] <= 0) {
      return;
    }
    
    actor.ammo[this.weaponType as EntityTypeEnum.Weapon1 | EntityTypeEnum.Weapon2]--;
    this.lastFireTime = 0;
    
    const bulletPos = new Vec2(
      actor.position.x + direction.x * 60,
      actor.position.y + direction.y * 60
    );

    EventManager.Instance.emit(EventEnum.BulletBorn, this.id);
    AudioManager.Instance.playSFX(AudioPathEnum.Shoot);

    DataManager.Instance.applyInput({
      type: InputTypeEnum.WeaponShoot,
      owner: this.id,
      position: {
        x: bulletPos.x,
        y: bulletPos.y,
      },
      direction: {
        x: direction.x,
        y: direction.y,
      },
    });

    EventManager.Instance.emit(EventEnum.UpdateWeaponDisplay);
  }

  init(data: IActor) {
    this.id = data.id;
    this.hp = this.node.getComponentInChildren(ProgressBar);
    this.bulletType = data.bulletType;
    this.weaponType = data.weaponType;
    this.fsm = this.addComponent(ActorStateMachine);
    this.fsm.init(data.type);

    const characterAttr = CHARACTER_ATTRIBUTES[data.type as EntityTypeEnum.Actor1 | EntityTypeEnum.Actor2];
    this.initialMaxHP = characterAttr.hp;
    this.initialSpeed = characterAttr.speed;

    this.state = EntityStateEnum.Idle;

    this.createWeapon(data.weaponType, data);

    EventManager.Instance.on(EventEnum.WeaponRotate, this.handleWeaponRotate, this);
    EventManager.Instance.on(EventEnum.UseInventoryItem, this.handleUseInventoryItem, this);
  }

  private createWeapon(weaponType: EntityTypeEnum, data: IActor) {
    const prefab = DataManager.Instance.prefabMap.get(weaponType);
    if (!prefab) {
      console.warn(`Weapon prefab not found: ${weaponType}`);
      return;
    }
    const weapon = instantiate(prefab);
    weapon.setParent(this.node);
    this.wm = weapon.addComponent(WeaponManager);
    this.wm.init(data);
  }

  switchWeapon(newWeaponType: EntityTypeEnum, newBulletType: EntityTypeEnum) {
    if (this.wm && this.wm.node) {
      this.wm.node.destroy();
      this.wm = null;
    }

    this.bulletType = newBulletType;
    this.weaponType = newWeaponType;
    this.lastFireTime = 0;

    const actor = DataManager.Instance.state.actors.find(a => a.id === this.id);
    if (actor) {
      this.createWeapon(newWeaponType, actor);
    }
  }

  onDestroy() {
    EventManager.Instance.off(EventEnum.WeaponRotate, this.handleWeaponRotate, this);
    EventManager.Instance.off(EventEnum.UseInventoryItem, this.handleUseInventoryItem, this);
  }

  handleUseInventoryItem(itemType: InventoryItemType) {
    if (this.id !== DataManager.Instance.myPlayerId) {
      return;
    }

    const inventory = DataManager.Instance.state.inventory;
    if (!inventory) {
      return;
    }

    if (inventory[this.getInventoryKey(itemType)] <= 0) {
      console.log(`${InventoryItemType[itemType]} is empty`);
      return;
    }

    if (!this.canUseItem(itemType)) {
      return;
    }

    inventory[this.getInventoryKey(itemType)]--;
    this.useItem(itemType);
    
    EventManager.Instance.emit(EventEnum.UpdateInventoryDisplay);
  }

  private getInventoryKey(itemType: InventoryItemType): keyof IInventory {
    switch (itemType) {
      case InventoryItemType.Ammo:
        return 'ammo';
      case InventoryItemType.HealthPack:
        return 'healthPack';
      case InventoryItemType.Elixir:
        return 'elixir';
      default:
        return 'ammo';
    }
  }

  private canUseItem(itemType: InventoryItemType): boolean {
    const actor = DataManager.Instance.state.actors.find(a => a.id === this.id);
    if (!actor) {
      return false;
    }

    switch (itemType) {
      case InventoryItemType.Ammo: {
        const weaponType = actor.weaponType as EntityTypeEnum.Weapon1 | EntityTypeEnum.Weapon2;
        const weaponAttr = WEAPON_ATTRIBUTES[weaponType];
        const currentAmmo = actor.ammo[weaponType];
        const maxAmmo = weaponAttr.maxAmmo;
        
        if (currentAmmo >= maxAmmo) {
          console.log('Ammo is already full');
          return false;
        }
        return true;
      }
      
      case InventoryItemType.HealthPack: {
        if (actor.hp >= this.initialMaxHP) {
          console.log('Health is already full');
          return false;
        }
        return true;
      }
      
      case InventoryItemType.Elixir:
        return true;
      
      default:
        return false;
    }
  }

  private useItem(itemType: InventoryItemType) {
    const actor = DataManager.Instance.state.actors.find(a => a.id === this.id);
    if (!actor) {
      return;
    }

    switch (itemType) {
      case InventoryItemType.Ammo:
        this.useAmmoItem(actor);
        break;
      case InventoryItemType.HealthPack:
        this.useHealthPackItem(actor);
        break;
      case InventoryItemType.Elixir:
        this.useElixirItem(actor);
        break;
    }
  }

  private useAmmoItem(actor: IActor) {
    const currentWeaponType = actor.weaponType as EntityTypeEnum.Weapon1 | EntityTypeEnum.Weapon2;
    const weaponAttr = WEAPON_ATTRIBUTES[currentWeaponType];
    const currentAmmo = actor.ammo[currentWeaponType];
    const maxAmmo = weaponAttr.maxAmmo;
    
    actor.ammo[currentWeaponType] = Math.min(currentAmmo + GAME_CONSTANTS.ITEM_EFFECTS.AMMO_RESTORE, maxAmmo);
    
    EventManager.Instance.emit(EventEnum.UpdateWeaponDisplay);
  }

  private useHealthPackItem(actor: IActor) {
    actor.hp = Math.min(actor.hp + GAME_CONSTANTS.ITEM_EFFECTS.HEALTH_RESTORE, this.initialMaxHP);
  }

  private useElixirItem(actor: IActor) {
    if (this.speedBoostActive) {
      this.speedBoostTimer = GAME_CONSTANTS.ITEM_EFFECTS.ELIXIR_DURATION;
    } else {
      this.speedBoostActive = true;
      this.speedBoostTimer = GAME_CONSTANTS.ITEM_EFFECTS.ELIXIR_DURATION;
      actor.speed = this.initialSpeed + GAME_CONSTANTS.ITEM_EFFECTS.ELIXIR_SPEED_BOOST;
    }
  }

  handleWeaponRotate(x: number, y: number) {
    if (this.id !== DataManager.Instance.myPlayerId) {
      return;
    }
    DataManager.Instance.applyInput({
      id: this.id,
      type: InputTypeEnum.WeaponRotate,
      direction: { x, y },
    });
  }

  render(data: IActor) {
    this.renderPos(data);
    this.renderDir(data);
    this.renderHP(data);
  }

  renderPos(data: IActor) {
    if (!this.node || !data.position) {
      return;
    }
    const { position } = data;
    const newPos = new Vec3(position.x, position.y);
    this.node.setPosition(newPos);
  }

  renderDir(data: IActor) {
    if (!this.node || !this.hp || !this.wm || !data.direction || !data.weaponDirection) {
      return;
    }
    const { direction, weaponDirection } = data;
    const isFacingRight = direction.x > 0;
    
    if (direction.x !== 0) {
      this.node.setScale(isFacingRight ? 1 : -1, 1);
      if (this.hp.node) {
        this.hp.node.setScale(isFacingRight ? 1 : -1, 1);
      }
    }

    if (this.wm.node) {
      this.wm.node.setScale(1, 1);
    }

    const side = Math.sqrt(weaponDirection.x ** 2 + weaponDirection.y ** 2);
    if (side !== 0) {
      let angle: number;
      if (weaponDirection.x >= 0) {
        angle = radToAngle(Math.asin(weaponDirection.y / side));
      } else {
        angle = 180 - radToAngle(Math.asin(weaponDirection.y / side));
      }
      
      if (!isFacingRight) {
        angle = 180 - angle;
      }
      
      if (this.wm.node) {
        this.wm.node.setRotationFromEuler(0, 0, angle);
      }
    }
  }

  renderHP(data: IActor) {
    if (!this.hp || data.hp === undefined || this.hp.totalLength === 0) {
      return;
    }
    this.hp.progress = data.hp / CHARACTER_ATTRIBUTES[data.type]["hp"];
  }
}
