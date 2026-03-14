import { IState } from "./State";

export const DEFAULT_GAME_STATE: IState = {
  actors: [],
  enemies: [],
  bullets: [],
  inventory: {
    ammo: 0,
    healthPack: 0,
    elixir: 0,
  },
  nextBulletId: 1,
  nextEnemyId: 1,
  seed: 1,
};
