import { _decorator, Component } from "cc";
import StateMachine from "./StateMachine";
import { EntityStateEnum } from "../Common/Enum";
const { ccclass, property } = _decorator;

@ccclass("EntityManager")
export abstract class EntityManager extends Component {
  fsm: StateMachine;
  private _state: EntityStateEnum;

  get state() {
    return this._state;
  }

  set state(newState) {
    this._state = newState;
    if (this.fsm) {
      this.fsm.setParams(newState, true);
    }
  }

  abstract init(...args: any[]): void;
}
