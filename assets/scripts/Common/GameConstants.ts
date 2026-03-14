/**
 * 游戏常量配置文件
 * 集中管理所有游戏相关的常量值，便于调整和平衡游戏
 */

import { EntityTypeEnum } from "./Enum";

// ==================== 接口定义 ====================
export interface IWeaponConfig {
  fireRate: number;
  damageMultiplier: number;
  maxAmmo: number;
}

export interface ICharacterAttribute {
  name: string;
  description: string;
  hp: number;
  speed: number;
}

export interface IWeaponAttribute {
  name: string;
  description: string;
  fireRate: number;
  damage: number;
  maxAmmo: number;
}

export interface IEnemyConfig {
  name: string;
  hp: number;
  speed: number;
  damage: number;
  dropProbability: number;
  itemDropChances: {
    ammo: number;
    health: number;
    elixir: number;
  };
}

export interface IEnemySpawnConfig {
  types: EntityTypeEnum[];
  maxEnemies: number;
  spawnInterval: number;
}

export const GAME_CONSTANTS = {
  // ==================== 移动速度 ====================
  /** 角色移动速度 */
  ACTOR_SPEED: 100,
  /** 子弹飞行速度 */
  BULLET_SPEED: 600,

  // ==================== 地图尺寸 ====================
  /** 地图宽度 */
  MAP_WIDTH: 1280,
  /** 地图高度 */
  MAP_HEIGHT: 720,

  // ==================== 碰撞半径 ====================
  /** 角色碰撞半径 */
  PLAYER_RADIUS: 50,
  /** 子弹碰撞半径 */
  BULLET_RADIUS: 10,
  /** 敌人碰撞半径 */
  ENEMY_RADIUS: 30,
  /** 掉落物品拾取半径 */
  DROP_ITEM_PICKUP_RADIUS: 40,

  // ==================== 伤害配置 ====================
  /** 基础子弹伤害 */
  BASE_BULLET_DAMAGE: 5,

  // ==================== 物品效果 ====================
  ITEM_EFFECTS: {
    /** 弹药包恢复量 */
    AMMO_RESTORE: 20,
    /** 血包恢复量 */
    HEALTH_RESTORE: 20,
    /** 合剂速度加成 */
    ELIXIR_SPEED_BOOST: 30,
    /** 合剂持续时间（秒） */
    ELIXIR_DURATION: 10,
  },

  // ==================== 碰撞层级 ====================
  COLLISION_LAYERS: {
    PLAYER: 1,
    ENEMY: 2,
    BULLET: 4,
  },

  // ==================== 生成配置 ====================
  ENEMY_SPAWN: {
    /** 最小生成半径（距离玩家） */
    MIN_SPAWN_RADIUS: 100,
    /** 最大生成半径（距离玩家） */
    MAX_SPAWN_RADIUS: 300,
  },

  // ==================== 距离阈值 ====================
  DISTANCE: {
    /** 敌人与角色碰撞检测距离 */
    ENEMY_ACTOR_COLLISION: 30,
    /** 子弹与敌人碰撞检测距离 */
    BULLET_ENEMY_COLLISION: 30,
    /** 目标位置到达阈值（像素） */
    TARGET_REACHED: 5,
  },

  // ==================== 战斗相关 ====================
  COMBAT: {
    /** 敌人伤害冷却时间（秒） */
    ENEMY_DAMAGE_COOLDOWN: 1,
    /** 暴击概率阈值 */
    CRITICAL_CHANCE_THRESHOLD: 0.5,
    /** 暴击伤害倍率 */
    CRITICAL_DAMAGE_MULTIPLIER: 2,
    /** 随机数种子除数 */
    RANDOM_SEED_DIVISOR: 233280,
  },

  // ==================== UI节点名称 ====================
  NODE_NAMES: {
    STAGE: "Stage",
    UI: "UI",
  },
};

// ==================== 武器配置 ====================
export const WEAPON_CONFIGS: Record<EntityTypeEnum.Weapon1 | EntityTypeEnum.Weapon2, IWeaponConfig> = {
  [EntityTypeEnum.Weapon1]: {
    fireRate: 0,
    damageMultiplier: 1,
    maxAmmo: 200,
  },
  [EntityTypeEnum.Weapon2]: {
    fireRate: 0.5,
    damageMultiplier: 4,
    maxAmmo: 60,
  },
};

export const WEAPON_ATTRIBUTES: Record<EntityTypeEnum.Weapon1 | EntityTypeEnum.Weapon2, IWeaponAttribute> = {
  [EntityTypeEnum.Weapon1]: {
    name: "冲锋枪",
    description: "高射速，低伤害，弹药容量大",
    fireRate: 0,
    damage: 5,
    maxAmmo: 200,
  },
  [EntityTypeEnum.Weapon2]: {
    name: "狙击枪",
    description: "低射速，高伤害，弹药容量小",
    fireRate: 0.5,
    damage: 20,
    maxAmmo: 60,
  },
};

// ==================== 角色配置 ====================
export const CHARACTER_ATTRIBUTES: Record<EntityTypeEnum.Actor1 | EntityTypeEnum.Actor2, ICharacterAttribute> = {
  [EntityTypeEnum.Actor1]: {
    name: "角色 1",
    description: "生命值高",
    hp: 120,
    speed: 80,
  },
  [EntityTypeEnum.Actor2]: {
    name: "角色 2",
    description: "移动速度快",
    hp: 80,
    speed: 120,
  },
};

// ==================== 敌人配置 ====================
export const ENEMY_CONFIGS: Record<EntityTypeEnum.Enemy1 | EntityTypeEnum.Enemy2 | EntityTypeEnum.Enemy3, IEnemyConfig> = {
  [EntityTypeEnum.Enemy1]: {
    name: "普通敌人",
    hp: 30,
    speed: 40,
    damage: 10,
    dropProbability: 0.3,
    itemDropChances: {
      ammo: 0.5,
      health: 0.3,
      elixir: 0.2,
    },
  },
  [EntityTypeEnum.Enemy2]: {
    name: "快速敌人",
    hp: 20,
    speed: 80,
    damage: 8,
    dropProbability: 0.25,
    itemDropChances: {
      ammo: 0.4,
      health: 0.4,
      elixir: 0.2,
    },
  },
  [EntityTypeEnum.Enemy3]: {
    name: "重装敌人",
    hp: 80,
    speed: 25,
    damage: 20,
    dropProbability: 0.5,
    itemDropChances: {
      ammo: 0.3,
      health: 0.3,
      elixir: 0.4,
    },
  },
};

// ==================== 敌人生成配置 ====================
export const ENEMY_SPAWN_CONFIG: IEnemySpawnConfig = {
  types: [EntityTypeEnum.Enemy1, EntityTypeEnum.Enemy2, EntityTypeEnum.Enemy3],
  maxEnemies: 10,
  spawnInterval: 3,
};

/**
 * 根据武器类型获取武器配置
 * @param weaponType 武器类型
 * @returns 武器配置
 */
export function getWeaponConfig(weaponType: EntityTypeEnum): IWeaponConfig {
  return WEAPON_CONFIGS[weaponType as EntityTypeEnum.Weapon1 | EntityTypeEnum.Weapon2];
}
