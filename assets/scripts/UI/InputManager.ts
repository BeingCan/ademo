import { Input, input, Vec2, EventMouse } from "cc";
import Singleton from "../Base/Singleton";

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
    this.isInitialized = true;
  }

  reset() {
    this.rightClickPos = null;
    this.leftClickPos = null;
    this.isPaused = false;
  }

  onDestroy() {
    input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
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
