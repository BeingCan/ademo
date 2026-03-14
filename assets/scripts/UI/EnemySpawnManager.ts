import { _decorator, Component, Vec2 } from "cc";
import { EntityTypeEnum, EventEnum } from "../Common/Enum";
import DataManager from "../Global/DataManager";
import EventManager from "../Global/EventManager";
import { ENEMY_CONFIGS, ENEMY_SPAWN_CONFIG, GAME_CONSTANTS } from "../Common/GameConstants";
const { ccclass } = _decorator;

@ccclass("EnemySpawnManager")
export class EnemySpawnManager extends Component {
  private spawnTimer: number = 0;
  private shouldSpawn: boolean = true;

  onLoad() {
  }

  update(dt: number) {
    if (!this.shouldSpawn) {
      return;
    }

    this.spawnTimer += dt;
    if (this.spawnTimer >= ENEMY_SPAWN_CONFIG.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }
  }

  private spawnEnemy() {
    const currentEnemies = DataManager.Instance.state.enemies.length;
    if (currentEnemies >= ENEMY_SPAWN_CONFIG.maxEnemies) {
      return;
    }

    const player = DataManager.Instance.state.actors.find(a => a.id === DataManager.Instance.myPlayerId);
    if (!player || !player.position) {
      return;
    }

    const enemyType = this.getRandomEnemyType();
    const spawnPos = this.getRandomSpawnPosition(player.position);
    const enemyId = DataManager.Instance.state.nextEnemyId++;
    const config = ENEMY_CONFIGS[enemyType as EntityTypeEnum.Enemy1 | EntityTypeEnum.Enemy2 | EntityTypeEnum.Enemy3];

    DataManager.Instance.state.enemies.push({
      id: enemyId,
      hp: config.hp,
      maxHp: config.hp,
      speed: config.speed,
      damage: config.damage,
      type: enemyType,
      position: spawnPos,
      direction: { x: 0, y: 0 },
    });

    EventManager.Instance.emit(EventEnum.EnemyBorn, enemyId);
  }

  private getRandomEnemyType(): EntityTypeEnum {
    const types = ENEMY_SPAWN_CONFIG.types;
    return types[Math.floor(Math.random() * types.length)];
  }

  private getRandomSpawnPosition(playerPos: { x: number; y: number }): { x: number; y: number } {
    const minRadius = GAME_CONSTANTS.ENEMY_SPAWN.MIN_SPAWN_RADIUS;
    const maxRadius = GAME_CONSTANTS.ENEMY_SPAWN.MAX_SPAWN_RADIUS;
    
    const angle = Math.random() * Math.PI * 2;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    
    const x = playerPos.x + Math.cos(angle) * radius;
    const y = playerPos.y + Math.sin(angle) * radius;
    
    return { x, y };
  }

  onDestroy() {
  }
}
