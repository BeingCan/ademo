import { Input, input, Vec2, EventMouse, EventKeyboard, KeyCode } from "cc";
import Singleton from "../Base/Singleton";
import EventManager from "../Global/EventManager";
import { EventEnum, InventoryItemType } from "../Common/Enum";

export class InputManager extends Singleton {
  static get Instance() {
    return super.GetInstance<InputManager>();
  }
  
  rightClickPos: Vec2 | null = null;
  leftClickPos: Vec2 | null = null;
  isPaused: boolean = false;
  private isInitialized: boolean = false;

  init() {
    if (this.isInitialized) {
      this.reset();
      return;
    }

    input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    this.isInitialized = true;
  }

  reset() {
    this.rightClickPos = null;
    this.leftClickPos = null;
    this.isPaused = false;
  }

  onDestroy() {
    input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    this.isInitialized = false;
  }

  onMouseDown(event: EventMouse) {
    if (this.isPaused) {
      return;
    }

    if (event.getButton() === EventMouse.BUTTON_RIGHT) {
      this.rightClickPos = new Vec2(event.getUILocation().x, event.getUILocation().y);
    } else if (event.getButton() === EventMouse.BUTTON_LEFT) {
      this.leftClickPos = new Vec2(event.getUILocation().x, event.getUILocation().y);
    }
  }

  onKeyDown(event: EventKeyboard) {
    if (this.isPaused) {
      return;
    }

    if (event.keyCode === KeyCode.TAB) {
      EventManager.Instance.emit(EventEnum.SwitchWeapon);
    } else if (event.keyCode === KeyCode.DIGIT_1 || event.keyCode === KeyCode.NUM_1) {
      EventManager.Instance.emit(EventEnum.UseInventoryItem, InventoryItemType.Ammo);
    } else if (event.keyCode === KeyCode.DIGIT_2 || event.keyCode === KeyCode.NUM_2) {
      EventManager.Instance.emit(EventEnum.UseInventoryItem, InventoryItemType.HealthPack);
    } else if (event.keyCode === KeyCode.DIGIT_3 || event.keyCode === KeyCode.NUM_3) {
      EventManager.Instance.emit(EventEnum.UseInventoryItem, InventoryItemType.Elixir);
    } else if (event.keyCode === KeyCode.DIGIT_4 || event.keyCode === KeyCode.NUM_4) {
    }
  }

  consumeRightClickPos(): Vec2 | null {
    const pos = this.rightClickPos;
    this.rightClickPos = null;
    return pos;
  }

  consumeLeftClickPos(): Vec2 | null {
    const pos = this.leftClickPos;
    this.leftClickPos = null;
    return pos;
  }
}
