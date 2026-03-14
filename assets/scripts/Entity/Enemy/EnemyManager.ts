import {
  _decorator,
  ProgressBar,
  Vec3,
} from "cc";
import { EntityManager } from "../../Base/EntityManager";
import {
  EntityStateEnum,
  EntityTypeEnum,
  InventoryItemType,
  EventEnum,
} from "../../Common/Enum";
import { IEnemy, IInventory } from "../../Common/State";
import DataManager from "../../Global/DataManager";
import EventManager from "../../Global/EventManager";
import { ObjectPoolManager } from "../../Global/ObjectPoolManager";
import { ENEMY_CONFIGS, IEnemyConfig } from "../../Common/GameConstants";
const { ccclass, property } = _decorator;

@ccclass("EnemyManager")
export class EnemyManager extends EntityManager {
  id: number;
  private hp: ProgressBar;

  init(data: IEnemy) {
    this.id = data.id;
    this.hp = this.node.getComponentInChildren(ProgressBar);
    this.state = EntityStateEnum.Idle;
    
    if (data.position && this.node) {
      this.node.setPosition(new Vec3(data.position.x, data.position.y));
    }
  }

  render(data: IEnemy) {
    this.renderPos(data);
    this.renderHP(data);
  }

  renderPos(data: IEnemy) {
    if (!this.node || !data.position) {
      return;
    }
    const { position } = data;
    const newPos = new Vec3(position.x, position.y);
    this.node.setPosition(newPos);
  }

  renderHP(data: IEnemy) {
    if (!this.hp || data.hp === undefined || this.hp.totalLength === 0) {
      return;
    }
    const config = ENEMY_CONFIGS[data.type as EntityTypeEnum.Enemy1 | EntityTypeEnum.Enemy2 | EntityTypeEnum.Enemy3];
    const maxHp = config.hp;
    const progress = data.hp / maxHp;
    this.hp.progress = Math.max(0, Math.min(1, progress));
  }

  onDestroy() {
  }

  die() {
    const data = DataManager.Instance.state.enemies.find(e => e.id === this.id);
    if (!data) {
      return;
    }

    const config = ENEMY_CONFIGS[data.type as EntityTypeEnum.Enemy1 | EntityTypeEnum.Enemy2 | EntityTypeEnum.Enemy3];
    
    if (Math.random() < config.dropProbability) {
      this.dropItem(data.position, config);
    }

    const index = DataManager.Instance.state.enemies.findIndex(e => e.id === this.id);
    if (index > -1) {
      DataManager.Instance.state.enemies.splice(index, 1);
    }

    DataManager.Instance.enemyMap.delete(this.id);
    
    if (this.node) {
      ObjectPoolManager.Instance.ret(this.node);
    }
  }

  private dropItem(position: { x: number; y: number }, config: IEnemyConfig) {
    interface IDropTableEntry {
      itemType: InventoryItemType;
      weight: number;
    }

    const dropTable: IDropTableEntry[] = [
      { itemType: InventoryItemType.Ammo, weight: config.itemDropChances.ammo },
      { itemType: InventoryItemType.HealthPack, weight: config.itemDropChances.health },
      { itemType: InventoryItemType.Elixir, weight: config.itemDropChances.elixir },
    ];

    const selected = this.selectFromDropTable(dropTable);
    if (selected) {
      const inventoryKey = this.getInventoryKey(selected);
      DataManager.Instance.state.inventory[inventoryKey]++;
      console.log(`Enemy dropped ${InventoryItemType[selected]}, inventory now: ammo=${DataManager.Instance.state.inventory.ammo}, health=${DataManager.Instance.state.inventory.healthPack}, elixir=${DataManager.Instance.state.inventory.elixir}`);
      EventManager.Instance.emit(EventEnum.UpdateInventoryDisplay);
    }
  }

  private getInventoryKey(itemType: InventoryItemType): keyof IInventory {
    switch (itemType) {
      case InventoryItemType.Ammo:
        return 'ammo';
      case InventoryItemType.HealthPack:
        return 'healthPack';
      case InventoryItemType.Elixir:
        return 'elixir';
      default:
        return 'ammo';
    }
  }

  private selectFromDropTable(dropTable: Array<{ itemType: InventoryItemType; weight: number }>): InventoryItemType | null {
    const roll = Math.random();
    let cumulative = 0;

    for (const entry of dropTable) {
      cumulative += entry.weight;
      if (roll <= cumulative) {
        return entry.itemType;
      }
    }

    return null;
  }
}
