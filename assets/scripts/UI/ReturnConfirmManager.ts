import { _decorator, Component, Button } from "cc";
import EventManager from "../Global/EventManager";
import { EventEnum } from "../Common/Enum";
const { ccclass, property } = _decorator;

@ccclass("ReturnConfirmManager")
export class ReturnConfirmManager extends Component {
  @property(Button)
  saveAndReturnButton: Button | null = null;

  @property(Button)
  returnWithoutSaveButton: Button | null = null;

  @property(Button)
  cancelButton: Button | null = null;

  onLoad() {
    this.setupEventListeners();
  }

  onDestroy() {
    this.removeEventListeners();
  }

  private setupEventListeners() {
    if (this.saveAndReturnButton && this.saveAndReturnButton.node) {
      this.saveAndReturnButton.node.on("click", this.onSaveAndReturn, this);
    }

    if (this.returnWithoutSaveButton && this.returnWithoutSaveButton.node) {
      this.returnWithoutSaveButton.node.on("click", this.onReturnWithoutSave, this);
    }

    if (this.cancelButton && this.cancelButton.node) {
      this.cancelButton.node.on("click", this.onCancel, this);
    }
  }

  private removeEventListeners() {
    if (this.saveAndReturnButton && this.saveAndReturnButton.node) {
      this.saveAndReturnButton.node.off("click", this.onSaveAndReturn, this);
    }

    if (this.returnWithoutSaveButton && this.returnWithoutSaveButton.node) {
      this.returnWithoutSaveButton.node.off("click", this.onReturnWithoutSave, this);
    }

    if (this.cancelButton && this.cancelButton.node) {
      this.cancelButton.node.off("click", this.onCancel, this);
    }
  }

  private onSaveAndReturn() {
    EventManager.Instance.emit(EventEnum.SaveAndReturn);
  }

  private onReturnWithoutSave() {
    EventManager.Instance.emit(EventEnum.ReturnWithoutSave);
  }

  private onCancel() {
    EventManager.Instance.emit(EventEnum.CloseReturnConfirm);
  }
}
