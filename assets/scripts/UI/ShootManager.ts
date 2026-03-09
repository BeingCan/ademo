import { _decorator, Component} from 'cc';
import EventManager from '../Global/EventManager';
import { EventEnum } from '../Common/Enum';
import { InputManager } from './InputManager';
const { ccclass, property } = _decorator;

@ccclass('ShootManager')
export class ShootManager extends Component {

    handleShoot(){
        if (InputManager.Instance.isPaused) {
            return;
        }
        EventManager.Instance.emit(EventEnum.WeaponShoot)
    }
}

