import { EntityTypeEnum, InputTypeEnum, InventoryItemType } from "./Enum";

export interface IVec2 {
  x: number;
  y: number;
}

export interface IActor {
  id: number;
  hp: number;
  speed: number;
  type: EntityTypeEnum;
  position: IVec2;
  direction: IVec2;
  weaponDirection: IVec2;
  weaponType: EntityTypeEnum;
  bulletType: EntityTypeEnum;
  ammo: Record<EntityTypeEnum.Weapon1 | EntityTypeEnum.Weapon2, number>;
}

export interface IEnemy {
  id: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  type: EntityTypeEnum;
  position: IVec2;
  direction: IVec2;
}

export interface IBullet {
  id: number;
  owner: number;
  position: IVec2;
  direction: IVec2;
  type: EntityTypeEnum;
  weaponType: EntityTypeEnum;
}

export interface IInventory {
  ammo: number;
  healthPack: number;
  elixir: number;
}

export interface IState {
  actors: IActor[];
  enemies: IEnemy[];
  bullets: IBullet[];
  inventory: IInventory;
  nextBulletId: number;
  nextEnemyId: number;
  seed: number;
}

export type IClientInput = IActorMove | IWeaponShoot | ITimePast | IWeaponRotate;

export interface IActorMove {
  id: number;
  type: InputTypeEnum.ActorMove;
  direction: IVec2;
  dt: number;
}

export interface IWeaponShoot {
  type: InputTypeEnum.WeaponShoot;
  owner: number;
  position: IVec2;
  direction: IVec2;
}

export interface ITimePast {
  type: InputTypeEnum.TimePast;
  dt: number;
}

export interface IWeaponRotate {
  id: number;
  type: InputTypeEnum.WeaponRotate;
  direction: IVec2;
}
