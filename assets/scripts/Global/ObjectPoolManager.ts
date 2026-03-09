import { _decorator, Node, Asset, instantiate } from "cc";
import Singleton from "../Base/Singleton";
import DataManager from "./DataManager";
import { EntityTypeEnum } from "../Common/Enum";

export class ObjectPoolManager extends Singleton {
  static get Instance() {
    return super.GetInstance<ObjectPoolManager>();
  }

  private objectPool: Node | null = null;
  private map: Map<EntityTypeEnum, Node[]> = new Map()

  reset() {
    this.objectPool = null;
    this.map.clear();
  }

  get(type: EntityTypeEnum){
    if(!this.objectPool){
      this.objectPool = new Node("objectPool")
      if (DataManager.Instance.stage) {
        this.objectPool.setParent(DataManager.Instance.stage)
      }
    }

    if(!this.map.has(type)){
      this.map.set(type,[])

      const container = new Node(type + 'Pool')
      if (this.objectPool) {
        container.setParent(this.objectPool)
      }
    }

    const nodes = this.map.get(type)
    if(!nodes || !nodes.length){
      const prefab = DataManager.Instance.prefabMap.get(type)
      if (!prefab) {
        console.error(`Prefab not found for type: ${type}`);
        return null;
      }
      const node = instantiate(prefab)
      node.name = type
      if (this.objectPool) {
        const poolNode = this.objectPool.getChildByName(type + 'Pool')
        if (poolNode) {
          node.setParent(poolNode)
        }
      }
      node.active = true
      return node
    }else{
      const node = nodes.pop()
      if (node) {
        node.active = true
      }
      return node
    }
  }

  ret(node: Node){
    if (!node) {
      return
    }
    node.active = false
    const type = node.name as EntityTypeEnum
    if (this.map.has(type)) {
      this.map.get(type)?.push(node)
    }
  }

}
