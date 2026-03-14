import { Component, EventTarget } from "cc";
import EventManager from "../Global/EventManager";
import { EventEnum } from "../Common/Enum";

/**
 * UI 管理器基类
 * 提供统一的事件监听管理和生命周期处理
 */
export abstract class BaseUIManager extends Component {
  /** 事件监听配置列表 */
  protected eventListeners: Array<{
    event: EventEnum;
    callback: (...args: any[]) => void;
  }> = [];

  /**
   * 组件加载时自动初始化和更新显示
   */
  onLoad() {
    this.setupEventListeners();
    this.updateDisplay();
  }

  /**
   * 组件销毁时自动移除所有事件监听
   */
  onDestroy() {
    this.removeEventListeners();
  }

  /**
   * 子类必须实现的显示更新方法
   */
  protected abstract updateDisplay(): void;

  /**
   * 子类需要实现的事件监听设置方法（可选）
   */
  protected setupEventListeners(): void {
    // 默认空实现，子类可选择性重写
  }

  /**
   * 添加事件监听器
   * @param event 事件类型
   * @param callback 回调函数
   */
  protected addEventListener(event: EventEnum, callback: (...args: any[]) => void) {
    this.eventListeners.push({ event, callback });
    EventManager.Instance.on(event, callback, this);
  }

  /**
   * 移除所有事件监听器
   */
  private removeEventListeners() {
    this.eventListeners.forEach(({ event, callback }) => {
      EventManager.Instance.off(event, callback, this);
    });
    this.eventListeners = [];
  }
}
