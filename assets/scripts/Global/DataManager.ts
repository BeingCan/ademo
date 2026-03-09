import { Prefab, SpriteFrame, Node } from "cc";
import Singleton from "../Base/Singleton";
import { JoyStickManager } from "../UI/JoyStickManager";
import { ActorManager } from "../Entity/Actor/ActorManager";
import { BulletManager } from "../Entity/Bullet/BulletManager";
import EventManager from "./EventManager";
import {IBullet, IClientInput, IState } from "../Common/State";
import { EntityTypeEnum, EventEnum, InputTypeEnum } from "../Common/Enum";
import { randomBySeed, toFixed } from "../Common/Utils";
import { DEFAULT_GAME_STATE } from "../Common/DefaultState";
import GameLaunchManager, { GameLaunchMode } from "./GameLaunchManager";

const ACTOR_SPEED = 100;
const BULLET_SPEED = 600;

const MAP_WIDTH = 1280;
const MAP_HEIGHT = 720;

const PLAYER_RADIUS = 50;
const BULLET_RADIUS = 10;

const BULLET_DAMAGE = 5;

export default class DataManager extends Singleton {
  static get Instance() {
    return super.GetInstance<DataManager>();
  }

  myPlayerId = 1;

  stage: Node;
  ui: Node;
  jm: JoyStickManager;

  actorMap: Map<number, ActorManager> = new Map();
  prefabMap: Map<string, Prefab> = new Map();
  textureMap: Map<string, SpriteFrame[]> = new Map();
  bulletMap: Map<number, BulletManager> = new Map();
 
  lastState: IState;

  state: IState = this.getInitialState();

  getInitialState(): IState {
    const launchMode = GameLaunchManager.Instance.getLaunchMode();
    if (launchMode === GameLaunchMode.ContinueGame) {
      const savedState = GameLaunchManager.Instance.getSavedState();
      if (savedState) {
        GameLaunchManager.Instance.clear();
        return savedState;
      }
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
        const bullet: IBullet = {
          id: this.state.nextBulletId++,
          owner: owner,
          position: position,
          direction: direction,
          type: this.actorMap.get(owner).bulletType,
        };

        EventManager.Instance.emit(EventEnum.BulletBorn, owner); //只有当子弹和武器的owner相同时才触发武器的attack状态

        this.state.bullets.push(bullet);
        break;
      }
      case InputTypeEnum.TimePast: {
        const { dt } = input;
        const { bullets, actors } = this.state;

        for (let i = bullets.length - 1; i >= 0; i--) {
          const bullet = bullets[i];

          for (let j = actors.length - 1 ; j >= 0 ; j--) {
            const actor = actors[j];
            if (
              bullet.owner !== actor.id && 
              (actor.position.x - bullet.position.x) ** 2 +
                (actor.position.y - bullet.position.y) ** 2 <
              (PLAYER_RADIUS + BULLET_RADIUS) ** 2
            ) {
              const random = randomBySeed(this.state.seed)
              this.state.seed = random
              const damage = random / 233280 >= 0.5 ? BULLET_DAMAGE * 2 : BULLET_DAMAGE
              actor.hp -= damage
              EventManager.Instance.emit(EventEnum.ExplosionBorn, bullet.id, {
                x: toFixed((bullet.position.x + actor.position.x) / 2),
                y: toFixed((bullet.position.y + actor.position.y) / 2),
              });
              bullets.splice(i, 1);
              break
            }
          }

          if (
            Math.abs(bullet.position.x) > MAP_WIDTH / 2 ||
            Math.abs(bullet.position.y) > MAP_HEIGHT / 2
          ) {
            EventManager.Instance.emit(EventEnum.ExplosionBorn, bullet.id, {
              x: bullet.position.x,
              y: bullet.position.y,
            });
            bullets.splice(i, 1);
            break
          }
        }

        for (const bullet of bullets) {
          bullet.position.x += toFixed(bullet.direction.x * dt * BULLET_SPEED);
          bullet.position.y += toFixed(bullet.direction.y * dt * BULLET_SPEED);
        }

        break;
      }
    }
  }
}
