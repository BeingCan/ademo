import { _decorator, Node, UITransform, Vec2 } from "cc";
import DataManager from "../../Global/DataManager";
import { EntityManager } from "../../Base/EntityManager";
import { WeaponStateMachine } from "./WeaponStateMachine";
import EventManager from "../../Global/EventManager";
import { IActor } from "../../Common/State";
import { EntityStateEnum, EventEnum, InputTypeEnum, EntityTypeEnum, AudioPathEnum } from "../../Common/Enum";
import { toFixed } from "../../Common/Utils";
import { getWeaponConfig } from "../../Common/GameConstants";
import AudioManager from "../../Global/AudioManager";
const { ccclass, property } = _decorator;

@ccclass("WeaponManager")
export class WeaponManager extends EntityManager {
  owner: number;
  weaponType: EntityTypeEnum;
  private body: Node;
  private anchor: Node;
  private point: Node;
  private lastFireTime: number = 0;

  init(data: IActor) {
    this.body = this.node.getChildByName("Body");
    this.anchor = this.body.getChildByName("Anchor");
    this.point = this.anchor.getChildByName("Point");
    this.owner = data.id;
    this.weaponType = data.weaponType;

    this.fsm = this.body.addComponent(WeaponStateMachine);
    this.fsm.init(data.weaponType);

    this.state = EntityStateEnum.Idle;
    EventManager.Instance.on(
      EventEnum.WeaponShoot,
      this.handleWeaponShoot,
      this,
    );
    EventManager.Instance.on(EventEnum.BulletBorn, this.handleBulletBorn, this);
  }

  onDestroy() {
    EventManager.Instance.off(
      EventEnum.WeaponShoot,
      this.handleWeaponShoot,
      this,
    );
    EventManager.Instance.off(
      EventEnum.BulletBorn,
      this.handleBulletBorn,
      this,
    );
  }

  update(dt: number) {
    this.lastFireTime += dt;
  }

  handleBulletBorn(owner: number) {
    if (owner !== this.owner) {
      return;
    }

    this.state = EntityStateEnum.Attack;
  }

  handleWeaponShoot() {
    if (this.owner !== DataManager.Instance.myPlayerId) {
      return;
    }

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

    const pointWorldPos = this.point.getWorldPosition();
    const pointStagePos = DataManager.Instance.stage
      .getComponent(UITransform)
      .convertToNodeSpaceAR(pointWorldPos);

    const anchorWorldPos = this.anchor.getWorldPosition();
    const direction = new Vec2(
      pointWorldPos.x - anchorWorldPos.x,
      pointWorldPos.y - anchorWorldPos.y,
    ).normalize();

    AudioManager.Instance.playSFX(AudioPathEnum.Shoot);

    DataManager.Instance.applyInput({
      type: InputTypeEnum.WeaponShoot,
      owner: this.owner,
      position: {
        x: pointStagePos.x,
        y: pointStagePos.y,
      },
      direction: {
        x: direction.x,
        y: direction.y,
      },
    });

    EventManager.Instance.emit(EventEnum.UpdateWeaponDisplay);
  }
}
