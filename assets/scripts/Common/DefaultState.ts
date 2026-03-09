import { IState } from "./State";
import { EntityTypeEnum } from "./Enum";

export const DEFAULT_GAME_STATE: IState = {
  actors: [
    {
      id: 1,
      hp: 100,
      type: EntityTypeEnum.Actor1,
      weaponType: EntityTypeEnum.Weapon1,
      bulletType: EntityTypeEnum.Bullet1,
      position: {
        x: -150,
        y: -150,
      },
      direction: {
        x: 1,
        y: 0,
      },
      weaponDirection: {
        x: 1,
        y: 0,
      },
    },
    {
      id: 2,
      hp: 100,
      type: EntityTypeEnum.Actor1,
      weaponType: EntityTypeEnum.Weapon1,
      bulletType: EntityTypeEnum.Bullet1,
      position: {
        x: 150,
        y: 150,
      },
      direction: {
        x: 1,
        y: 0,
      },
      weaponDirection: {
        x: 1,
        y: 0,
      },
    },
  ],
  bullets: [],
  nextBulletId: 1,
  seed: 1,
};
