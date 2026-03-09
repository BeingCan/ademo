export enum FsmParamTypeEnum {
  Number = "Number",
  Trigger = "Trigger",
}

export enum ParamsNameEnum {
  Idle = "Idle",
  Run = "Run",
  Attack = "Attack",
}

export enum EntityTypeEnum {
  Actor1 = "Actor1",
  Actor2 = "Actor2",
  Bg = "Bg",
  Weapon1 = "Weapon1",
  Weapon2 = "Weapon2",
  Bullet1 = "Bullet1",
  Bullet2 = "Bullet2",
  Explosion = "Explosion",
  Setting = "Setting",
  SettingButton = "SettingButton",
  ReturnConfirm = "ReturnConfirm",
}

export enum EntityStateEnum {
  Idle = "Idle",
  Run = "Run",
  Attack = "Attack",
}

export enum EventEnum {
  WeaponShoot = "WeaponShoot",
  ExplosionBorn = "ExplosionBorn",
  BulletBorn = "BulletBorn",
  OpenSetting = "OpenSetting",
  CloseSetting = "CloseSetting",
  ControlModeChanged = "ControlModeChanged",
  QuitGame = "QuitGame",
  SaveAndReturn = "SaveAndReturn",
  ReturnWithoutSave = "ReturnWithoutSave",
  OpenReturnConfirm = "OpenReturnConfirm",
  CloseReturnConfirm = "CloseReturnConfirm",
  WeaponRotate = "WeaponRotate",
}

export enum ControlModeEnum {
  Joystick = "Joystick",
  Keyboard = "Keyboard",
}

export enum PrefabPathEnum {
  Bg = "prefab/Bg",
  Actor1 = "prefab/Actor1",
  Actor2 = "prefab/Actor2",
  Weapon1 = "prefab/Weapon1",
  Weapon2 = "prefab/Weapon2",
  Bullet1 = "prefab/Bullet1",
  Bullet2 = "prefab/Bullet2",
  Explosion = "prefab/Explosion",
  Setting = "prefab/Setting",
  SettingButton = "prefab/SettingButton",
  ReturnConfirm = "prefab/ReturnConfirm",
}

export enum TexturePathEnum {
  Actor1Idle = "texture/actor/actor1/idle",
  Actor1Run = "texture/actor/actor1/run",
  Actor2Idle = "texture/actor/actor2/idle",
  Actor2Run = "texture/actor/actor2/run",
  Weapon1Idle = "texture/weapon/weapon1/idle",
  Weapon1Attack = "texture/weapon/weapon1/attack",
  Weapon2Idle = "texture/weapon/weapon2/idle",
  Weapon2Attack = "texture/weapon/weapon2/attack",
  Bullet1Idle = "texture/bullet/bullet1",
  Bullet2Idle = "texture/bullet/bullet2",
  ExplosionIdle = "texture/explosion",
}

export enum AudioPathEnum {
  BGM = "audio/bgm",
  Shoot = "audio/shoot",
  Explosion = "audio/explosion",
}

export enum AudioTypeEnum {
  BGM = "BGM",
  SFX = "SFX",
}

export enum InputTypeEnum {
  ActorMove,
  WeaponShoot,
  TimePast,
  WeaponRotate,
}

export enum SceneEnum {
  battle = "battle",
  start = "start",
}
