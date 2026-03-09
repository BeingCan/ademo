import { _decorator, resources, Asset } from "cc";
import Singleton from "../Base/Singleton";

export class ResourceManager extends Singleton {
  static get Instance() {
    return super.GetInstance<ResourceManager>();
  }

  /**
   * 加载单个资源
   * @param path 资源路径
   * @param type 资源类型
   * @returns 
   */
  loadRes<T extends Asset>(path: string, type: new (...args: any[]) => T) {
    return new Promise<T>((resolve, reject) => {
      resources.load(path, type, (err, res) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
  }

  /**
   * 加载某个目录下的资源
   * @param path 资源路径
   * @param type 资源类型
   * @returns 
   */
  loadDir<T extends Asset>(path: string, type: new (...args: any[]) => T) {
    return new Promise<T[]>((resolve, reject) => {
      resources.loadDir(path, type, (err, res) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
  }
}
