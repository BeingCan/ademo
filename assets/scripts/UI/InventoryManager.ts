import { _decorator, Label } from "cc";
import { EventEnum } from "../Common/Enum";
import DataManager from "../Global/DataManager";
import { BaseUIManager } from "./BaseUIManager";
const { ccclass, property } = _decorator;

@ccclass("InventoryManager")
export class InventoryManager extends BaseUIManager {
  @property(Label) ammoLabel: Label | null = null;
  @property(Label) healthPackLabel: Label | null = null;
  @property(Label) elixirLabel: Label | null = null;

  protected setupEventListeners() {
    this.addEventListener(EventEnum.UpdateInventoryDisplay, this.updateDisplay);
  }

  protected updateDisplay() {
    const inventory = DataManager.Instance.state.inventory;

    this.updateItemDisplay(
      this.ammoLabel,
      inventory.ammo
    );

    this.updateItemDisplay(
      this.healthPackLabel,
      inventory.healthPack
    );

    this.updateItemDisplay(
      this.elixirLabel,
      inventory.elixir
    );
  }

  private updateItemDisplay(
    label: Label | null,
    count: number
  ) {
    if (label) {
      label.string = count.toString();
    }
  }
}
