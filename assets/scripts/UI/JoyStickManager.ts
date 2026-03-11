import { _decorator, Component, EventTouch, Input, input, Node, UITransform, Vec2 } from 'cc';
import { InputManager } from './InputManager';
const { ccclass, property } = _decorator;

@ccclass('JoyStickManager')
export class JoyStickManager extends Component {

    input: Vec2 = Vec2.ZERO 
    
    private move: Node
    private stick: Node
    private defaultPos: Vec2
    private radius: number = 0
    private isTouching: boolean = false
    private activeTouchId: number | null = null

    onLoad() {
        this.move = this.node.getChildByName("Move")
        this.stick = this.move.getChildByName("Stick")
        this.defaultPos = new Vec2(this.move.position.x, this.move.position.y)
        this.radius = this.move.getComponent(UITransform).contentSize.x / 2

        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this)
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this)
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this)
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this)
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this)
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this)
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this)
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this)

    }

    onTouchStart(e: EventTouch){
        if (InputManager.Instance.isPaused) {
            return;
        }

        if (this.activeTouchId === null) {
            this.activeTouchId = e.getID()
            const touchPos = e.getUILocation()
            this.move.setPosition(touchPos.x, touchPos.y)
            this.isTouching = true
        }
    }

    onTouchEnd(e: EventTouch) {
        if (this.activeTouchId === e.getID()) {
            this.move.setPosition(this.defaultPos.x, this.defaultPos.y)
            this.stick.setPosition(0, 0)
            this.input = Vec2.ZERO
            this.isTouching = false
            this.activeTouchId = null
        }
    }

    onTouchMove(e: EventTouch) {
        if (InputManager.Instance.isPaused) {
            return;
        }

        if (!this.isTouching || this.activeTouchId !== e.getID()) return
        
        const touchPos = e.getUILocation()
        const stickPos = new Vec2(touchPos.x - this.move.position.x, touchPos.y - this.move.position.y)

        if(stickPos.length() > this.radius){
            stickPos.multiplyScalar(this.radius / stickPos.length())  //限制小圆盘只能在大圆盘内
        }
        this.stick.setPosition(stickPos.x, stickPos.y)

        this.input = stickPos.clone().normalize()  //对当前向量进行归一化，在第一象限为(0<x<1, 0<y<1),其他同上

    }
}

