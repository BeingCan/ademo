import { IVec2, _decorator } from 'cc';
import { EntityManager } from '../../Base/EntityManager';
import { ExplosionStateMachine } from './ExplosionStateMachine';
import { EntityStateEnum, EntityTypeEnum } from '../../Common/Enum';
const { ccclass, property } = _decorator;

@ccclass('ExplosionManager')
export class ExplosionManager extends EntityManager {

    init(type: EntityTypeEnum, {x, y}: IVec2){
        this.node.setPosition(x,y)
        this.fsm = this.addComponent(ExplosionStateMachine)
        this.fsm.init(type)

        this.state = EntityStateEnum.Idle
    }

}

