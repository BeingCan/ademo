import { _decorator, Component, EventTouch, Input, input, Vec2, view } from 'cc';
import EventManager from '../Global/EventManager';
import { EventEnum, ControlModeEnum } from '../Common/Enum';
import DataManager from '../Global/DataManager';
import { JoyStickManager } from './JoyStickManager';
import { InputManager } from './InputManager';
import SettingsManager from '../Global/SettingsManager';
const { ccclass } = _decorator;

@ccclass('ScreenTouchManager')
export class ScreenTouchManager extends Component {
  private activeTouchId: number | null = null;

  private isJoyStickActive(): boolean {
    if (DataManager.Instance.jm) {
      const jm = DataManager.Instance.jm as JoyStickManager;
      return (jm as any).activeTouchId !== null;
    }
    return false;
  }

  onLoad() {
    input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
    input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }

  onDestroy() {
    input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
    input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }

  onTouchStart(e: EventTouch) {
    if (InputManager.Instance.isPaused) {
      return;
    }

    const controlMode = SettingsManager.Instance.controlMode;
    
    if (controlMode === ControlModeEnum.Joystick && this.activeTouchId === null) {
      this.activeTouchId = e.getID();
      
      const actor = DataManager.Instance.state.actors.find(a => a.id === DataManager.Instance.myPlayerId);
      const actorManager = DataManager.Instance.actorMap.get(DataManager.Instance.myPlayerId);
      
      if (actor && actorManager && actor.position) {
        const touchPos = e.getUILocation();
        const visibleSize = view.getVisibleSize();
        
        const worldTouchX = touchPos.x - visibleSize.width / 2;
        const worldTouchY = touchPos.y - visibleSize.height / 2;
        
        const dirX = worldTouchX - actor.position.x;
        const dirY = worldTouchY - actor.position.y;
        
        const dir = new Vec2(dirX, dirY);
        if (dir.length() > 0) {
          dir.normalize();
          EventManager.Instance.emit(EventEnum.WeaponRotate, dir.x, dir.y);
        }
      }
    }
  }

  onTouchEnd(e: EventTouch) {
    if (this.activeTouchId === e.getID()) {
      this.activeTouchId = null;
    }
  }
}
