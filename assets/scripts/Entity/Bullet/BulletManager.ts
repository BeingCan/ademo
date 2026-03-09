import { IVec2, Tween, Vec2, Vec3, _decorator, instantiate, tween } from "cc";
import { EntityManager } from "../../Base/EntityManager";
import { BulletStateMachine } from "./BulletStateMachine";
import EventManager from "../../Global/EventManager";
import DataManager from "../../Global/DataManager";
import { ExplosionManager } from "../Explosion/ExplosionManager";
import { ObjectPoolManager } from "../../Global/ObjectPoolManager";
import { EntityStateEnum, EntityTypeEnum, EventEnum } from "../../Common/Enum";
import { IBullet } from "../../Common/State";
import { radToAngle } from "../../Common/Utils";
const { ccclass, property } = _decorator;

@ccclass("BulletManager")
export class BulletManager extends EntityManager {
  type: EntityTypeEnum;
  id: number;

  init(data: IBullet) {
    this.type = data.type;
    this.id = data.id;
    this.fsm = this.addComponent(BulletStateMachine);
    this.fsm.init(data.type);

    this.state = EntityStateEnum.Idle;
    this.node.active = false

    EventManager.Instance.on(
      EventEnum.ExplosionBorn,
      this.handleExplosionBorn,
      this,
    );
  }

  handleExplosionBorn(id: number, { x, y }: IVec2) {
    if (this.id !== id) {
      return;
    }
    const explosion = ObjectPoolManager.Instance.get(EntityTypeEnum.Explosion);
    const em =
      explosion.getComponent(ExplosionManager) ||
      explosion.addComponent(ExplosionManager);
    em.init(EntityTypeEnum.Explosion, { x, y });

    EventManager.Instance.off(
      EventEnum.ExplosionBorn,
      this.handleExplosionBorn,
      this,
    );
    DataManager.Instance.bulletMap.delete(this.id);
    ObjectPoolManager.Instance.ret(this.node);
  }

  render(data: IBullet) {

    this.renderPos(data);
    this.renderDir(data);
  }

  renderPos(data: IBullet) {
    if (!this.node || !data.position) {
      return;
    }
    this.node.active = true
    const { position } = data;
    this.node.setPosition(position.x, position.y);
  }

  renderDir(data: IBullet) {
    if (!this.node || !data.direction) {
      return;
    }
    const { direction } = data;

    const side = Math.sqrt(direction.x ** 2 + direction.y ** 2);
    if (side !== 0) {
      const rad = Math.asin(direction.y / side);
      const angle = direction.x > 0 ? radToAngle(rad) : radToAngle(-rad) + 180;
      this.node.setRotationFromEuler(0, 0, angle);
    }
  }
}
