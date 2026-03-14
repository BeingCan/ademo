import { Prefab, SpriteFrame, Node } from "cc";
import Singleton from "../Base/Singleton";
import { JoyStickManager } from "../UI/JoyStickManager";
import { ActorManager } from "../Entity/Actor/ActorManager";
import { BulletManager } from "../Entity/Bullet/BulletManager";
import EventManager from "./EventManager";
import {IBullet, IClientInput, IState } from "../Common/State";
import { EntityTypeEnum, EventEnum, InputTypeEnum } from "../Common/Enum";
import { toFixed } from "../Common/Utils";
import { DEFAULT_GAME_STATE } from "../Common/DefaultState";
import GameLaunchManager from "./GameLaunchManager";
import { EnemyManager } from "../Entity/Enemy/EnemyManager";
import { GAME_CONSTANTS } from "../Common/GameConstants";

const { ACTOR_SPEED, BULLET_SPEED, MAP_WIDTH, MAP_HEIGHT } = GAME_CONSTANTS;

export default class DataManager extends Singleton {
  static get Instance() {
    return super.GetInstance<DataManager>();
  }

  myPlayerId = 1;

  stage: Node;
  ui: Node;
  jm: JoyStickManager;

  actorMap: Map<number, ActorManager> = new Map();
  bulletMap: Map<number, BulletManager> = new Map();
  enemyMap: Map<number, EnemyManager> = new Map();
  prefabMap: Map<string, Prefab> = new Map();
  textureMap: Map<string, SpriteFrame[]> = new Map();

  state: IState = this.getInitialState();

  getInitialState(): IState {
    const savedState = GameLaunchManager.Instance.getSavedState();
    if (savedState) {
      GameLaunchManager.Instance.clear();
      
      const defaultState = JSON.parse(JSON.stringify(DEFAULT_GAME_STATE));
      
      if (!savedState.inventory) {
        savedState.inventory = defaultState.inventory;
      }
      
      for (const actor of savedState.actors) {
        if (!actor.ammo) {
          actor.ammo = defaultState.actors[0]?.ammo || {
            [EntityTypeEnum.Weapon1]: 0,
            [EntityTypeEnum.Weapon2]: 0
          };
        }
      }
      
      return savedState;
    }
    return JSON.parse(JSON.stringify(DEFAULT_GAME_STATE));
  }

  applyInput(input: IClientInput) {

    switch (input.type) {
      case InputTypeEnum.ActorMove: {
        const {
          id,
          dt,
          direction: { x, y },
        } = input;

        const actor = this.state.actors.find((e) => e.id === id);
        actor.direction.x = x;
        actor.direction.y = y;

        actor.position.x += toFixed(x * dt * ACTOR_SPEED);
        actor.position.y += toFixed(y * dt * ACTOR_SPEED);
        break;
      }
      case InputTypeEnum.WeaponRotate: {
        const {
          id,
          direction: { x, y },
        } = input;

        const actor = this.state.actors.find((e) => e.id === id);
        actor.weaponDirection.x = x;
        actor.weaponDirection.y = y;
        break;
      }
      case InputTypeEnum.WeaponShoot: {
        const { owner, position, direction } = input;
        const actor = this.state.actors.find((e) => e.id === owner);
        const bullet: IBullet = {
          id: this.state.nextBulletId++,
          owner: owner,
          position: position,
          direction: direction,
          type: this.actorMap.get(owner).bulletType,
          weaponType: actor ? actor.weaponType : EntityTypeEnum.Weapon1,
        };

        EventManager.Instance.emit(EventEnum.BulletBorn, owner); //只有当子弹和武器的owner相同时才触发武器的attack状态

        this.state.bullets.push(bullet);
        break;
      }
      case InputTypeEnum.TimePast: {
        const { dt } = input;
        
        this.updateBullets(dt);
        break;
      }
    }
  }

  /**
   * 更新所有子弹的位置
   * @param dt - 时间增量（秒）
   */
  private updateBullets(dt: number) {
    const { bullets } = this.state;
    
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      
      bullet.position.x += toFixed(bullet.direction.x * dt * BULLET_SPEED);
      bullet.position.y += toFixed(bullet.direction.y * dt * BULLET_SPEED);
      
      if (this.checkBulletOutOfBounds(bullet)) {
        this.removeBullet(i, bullet.position);
      }
    }
  }

  /**
   * 检查子弹是否超出地图边界
   * @param bullet - 子弹数据
   * @returns 是否超出边界
   */
  private checkBulletOutOfBounds(bullet: IBullet): boolean {
    return Math.abs(bullet.position.x) > MAP_WIDTH / 2 ||
           Math.abs(bullet.position.y) > MAP_HEIGHT / 2;
  }

  /**
   * 移除子弹并触发爆炸效果
   * @param index - 子弹在数组中的索引
   * @param position - 子弹位置
   */
  private removeBullet(index: number, position: { x: number; y: number }) {
    const bullet = this.state.bullets[index];
    EventManager.Instance.emit(EventEnum.ExplosionBorn, bullet.id, position);
    this.state.bullets.splice(index, 1);
  }
}
