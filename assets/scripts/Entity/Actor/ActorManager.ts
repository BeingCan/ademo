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
} from "../../Common/Enum";
import { IActor } from "../../Common/State";
import { radToAngle } from "../../Common/Utils";
import { ActorStateMachine } from "./ActorStateMachine";
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

  private wm: WeaponManager;
  private hp: ProgressBar;
  private targetMovePos: Vec2 | null = null;

  tick(dt: number): void {
    if (!this.fsm) {
      return;
    }
    if (this.id !== DataManager.Instance.myPlayerId) {
      return;
    }

    let moveInput = Vec2.ZERO.clone();
    const controlMode = SettingsManager.Instance.controlMode;
    const actor = DataManager.Instance.state.actors.find(a => a.id === DataManager.Instance.myPlayerId);

    if (controlMode === ControlModeEnum.Keyboard) {
      const rightClickPos = InputManager.Instance.consumeRightClickPos();
      if (rightClickPos && actor && actor.position) {
        const visibleSize = view.getVisibleSize();
        const worldTouchX = rightClickPos.x - visibleSize.width / 2;
        const worldTouchY = rightClickPos.y - visibleSize.height / 2;
        this.targetMovePos = new Vec2(worldTouchX, worldTouchY);
      }

      if (this.targetMovePos && actor && actor.position) {
        const dirX = this.targetMovePos.x - actor.position.x;
        const dirY = this.targetMovePos.y - actor.position.y;
        const distance = Math.sqrt(dirX ** 2 + dirY ** 2);
        
        if (distance > 5) {
          const dir = new Vec2(dirX, dirY);
          dir.normalize();
          moveInput.set(dir.x, dir.y);
        } else {
          this.targetMovePos = null;
        }
      }
    }

    if (controlMode === ControlModeEnum.Joystick) {
      if (DataManager.Instance.jm && DataManager.Instance.jm.input.length() > 0) {
        if (moveInput.length() === 0) {
          moveInput.set(DataManager.Instance.jm.input.x, DataManager.Instance.jm.input.y);
          this.targetMovePos = null;
        }
      }
    }

    if (moveInput.length() > 0) {
      const { x, y } = moveInput;
      DataManager.Instance.applyInput({
        id: 1,
        type: InputTypeEnum.ActorMove,
        direction: {
          x,
          y,
        },
        dt,
      });
      this.state = EntityStateEnum.Run;
    } else {
      this.state = EntityStateEnum.Idle;
    }

    if (controlMode === ControlModeEnum.Keyboard) {
      const leftClickPos = InputManager.Instance.consumeLeftClickPos();
      if (leftClickPos && actor && actor.position) {
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
    }
  }

  private shootAtDirection(direction: Vec2): void {
    const actor = DataManager.Instance.state.actors.find(a => a.id === DataManager.Instance.myPlayerId);
    if (!actor || !actor.position) {
      return;
    }
    
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
  }

  init(data: IActor) {
    this.id = data.id;
    this.hp = this.node.getComponentInChildren(ProgressBar);
    this.bulletType = data.bulletType;
    this.fsm = this.addComponent(ActorStateMachine);
    this.fsm.init(data.type);

    this.state = EntityStateEnum.Idle;

    const prefab = DataManager.Instance.prefabMap.get(EntityTypeEnum.Weapon1);
    const weapon = instantiate(prefab);
    weapon.setParent(this.node);
    this.wm = weapon.addComponent(WeaponManager);
    this.wm.init(data);

    EventManager.Instance.on(EventEnum.WeaponRotate, this.handleWeaponRotate, this);
  }

  onDestroy() {
    EventManager.Instance.off(EventEnum.WeaponRotate, this.handleWeaponRotate, this);
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
    this.hp.progress = data.hp / this.hp.totalLength;
  }
}
