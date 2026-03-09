import { _decorator, Component, Button } from "cc";
import EventManager from "../Global/EventManager";
import { EventEnum } from "../Common/Enum";
const { ccclass, property } = _decorator;

@ccclass("SettingButtonManager")
export class SettingButtonManager extends Component {
  @property(Button)
  settingButton: Button | null = null;

  onLoad() {
    if (this.settingButton && this.settingButton.node) {
      this.settingButton.node.on("click", this.onSettingClick, this);
    }
  }

  onDestroy() {
    if (this.settingButton && this.settingButton.node) {
      this.settingButton.node.off("click", this.onSettingClick, this);
    }
  }

  onSettingClick() {
    EventManager.Instance.emit(EventEnum.OpenSetting);
  }
}
