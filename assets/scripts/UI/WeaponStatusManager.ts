import { _decorator,Label } from "cc";
import { EventEnum, EntityTypeEnum } from "../Common/Enum";
import DataManager from "../Global/DataManager";
import { BaseUIManager } from "./BaseUIManager";
import { WEAPON_ATTRIBUTES } from "../Common/GameConstants";
const { ccclass, property } = _decorator;

@ccclass("WeaponStatusManager")
export class WeaponStatusManager extends BaseUIManager {
  @property(Label) weaponNameLabel: Label | null = null;
  @property(Label) ammoLabel: Label | null = null;

  protected setupEventListeners() {
    this.addEventListener(EventEnum.SwitchWeapon, this.updateDisplay);
    this.addEventListener(EventEnum.UpdateWeaponDisplay, this.updateDisplay);
  }

  protected updateDisplay() {
    const actor = DataManager.Instance.state.actors.find(a => a.id === DataManager.Instance.myPlayerId);
    if (!actor) {
      return;
    }

    const weaponType = actor.weaponType;
    const attributes = WEAPON_ATTRIBUTES[weaponType as EntityTypeEnum.Weapon1 | EntityTypeEnum.Weapon2];
    const currentAmmo = actor.ammo[weaponType as EntityTypeEnum.Weapon1 | EntityTypeEnum.Weapon2];

    if (this.weaponNameLabel) {
      this.weaponNameLabel.string = attributes.name;
    }

    if (this.ammoLabel) {
      this.ammoLabel.string = `${currentAmmo} / ${attributes.maxAmmo}`;
    }
  }
}
