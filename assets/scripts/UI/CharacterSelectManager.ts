import { _decorator, Component, Node, Button, Label,  instantiate } from "cc";
import { EntityTypeEnum, EventEnum } from "../Common/Enum";
import EventManager from "../Global/EventManager";
import DataManager from "../Global/DataManager";
import { CHARACTER_ATTRIBUTES, WEAPON_ATTRIBUTES } from "../Common/GameConstants";
const { ccclass, property } = _decorator;

@ccclass("CharacterSelectManager")
export class CharacterSelectManager extends Component {
  @property(Button) prevCharacterButton: Button | null = null;
  @property(Button) nextCharacterButton: Button | null = null;
  @property(Button) prevWeaponButton: Button | null = null;
  @property(Button) nextWeaponButton: Button | null = null;
  @property(Button) startGameButton: Button | null = null;
  @property(Button) backButton: Button | null = null;

  @property(Label) characterNameLabel: Label | null = null;
  @property(Label) characterDescLabel: Label | null = null;
  @property(Label) characterHpLabel: Label | null = null;
  @property(Label) characterSpeedLabel: Label | null = null;

  @property(Label) weaponNameLabel: Label | null = null;
  @property(Label) weaponDescLabel: Label | null = null;
  @property(Label) weaponFireRateLabel: Label | null = null;
  @property(Label) weaponDamageLabel: Label | null = null;
  @property(Label) weaponAmmoLabel: Label | null = null;

  @property(Node) characterDisplay: Node | null = null;
  @property(Node) weaponDisplay: Node | null = null;

  private currentCharacterIndex = 0;
  private currentWeaponIndex = 0;
  private characters = [EntityTypeEnum.Actor1, EntityTypeEnum.Actor2];
  private weapons = [EntityTypeEnum.Weapon1, EntityTypeEnum.Weapon2];
  private currentCharacterNode: Node | null = null;
  private currentWeaponNode: Node | null = null;

  onLoad() {
    this.updateCharacterDisplay();
    this.updateWeaponDisplay();
    this.setupButtons();
  }

  onDestroy() {
    this.cleanup();
  }

  private setupButtons() {
    if (this.prevCharacterButton) {
      this.prevCharacterButton.node.on(Button.EventType.CLICK, this.onPrevCharacter, this);
    }
    if (this.nextCharacterButton) {
      this.nextCharacterButton.node.on(Button.EventType.CLICK, this.onNextCharacter, this);
    }
    if (this.prevWeaponButton) {
      this.prevWeaponButton.node.on(Button.EventType.CLICK, this.onPrevWeapon, this);
    }
    if (this.nextWeaponButton) {
      this.nextWeaponButton.node.on(Button.EventType.CLICK, this.onNextWeapon, this);
    }
    if (this.startGameButton) {
      this.startGameButton.node.on(Button.EventType.CLICK, this.onStartGame, this);
    }
    if (this.backButton) {
      this.backButton.node.on(Button.EventType.CLICK, this.onBack, this);
    }
  }

  private onPrevCharacter() {
    this.currentCharacterIndex = (this.currentCharacterIndex - 1 + this.characters.length) % this.characters.length;
    this.updateCharacterDisplay();
  }

  private onNextCharacter() {
    this.currentCharacterIndex = (this.currentCharacterIndex + 1) % this.characters.length;
    this.updateCharacterDisplay();
  }

  private onPrevWeapon() {
    this.currentWeaponIndex = (this.currentWeaponIndex - 1 + this.weapons.length) % this.weapons.length;
    this.updateWeaponDisplay();
  }

  private onNextWeapon() {
    this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
    this.updateWeaponDisplay();
  }

  private updateCharacterDisplay() {
    const characterType = this.characters[this.currentCharacterIndex];
    const attributes = CHARACTER_ATTRIBUTES[characterType as EntityTypeEnum.Actor1 | EntityTypeEnum.Actor2];

    if (this.characterNameLabel) {
      this.characterNameLabel.string = attributes.name;
    }
    if (this.characterDescLabel) {
      this.characterDescLabel.string = attributes.description;
    }
    if (this.characterHpLabel) {
      this.characterHpLabel.string = `生命值: ${attributes.hp}`;
    }
    if (this.characterSpeedLabel) {
      this.characterSpeedLabel.string = `移动速度: ${attributes.speed}`;
    }

    this.updateCharacterModel(characterType);
  }

  private updateWeaponDisplay() {
    const weaponType = this.weapons[this.currentWeaponIndex];
    const attributes = WEAPON_ATTRIBUTES[weaponType as EntityTypeEnum.Weapon1 | EntityTypeEnum.Weapon2];

    if (this.weaponNameLabel) {
      this.weaponNameLabel.string = attributes.name;
    }
    if (this.weaponDescLabel) {
      this.weaponDescLabel.string = attributes.description;
    }
    if (this.weaponFireRateLabel) {
      this.weaponFireRateLabel.string = `射速: ${attributes.fireRate === 0 ? "无间隔" : attributes.fireRate + "秒"}`;
    }
    if (this.weaponDamageLabel) {
      this.weaponDamageLabel.string = `伤害: ${attributes.damage}`;
    }
    if (this.weaponAmmoLabel) {
      this.weaponAmmoLabel.string = `弹药: ${attributes.maxAmmo}`;
    }

    this.updateWeaponModel(weaponType);
  }

  private updateCharacterModel(characterType: EntityTypeEnum) {
    if (this.currentCharacterNode) {
      this.currentCharacterNode.destroy();
      this.currentCharacterNode = null;
    }

    if (this.characterDisplay) {
      const prefab = DataManager.Instance.prefabMap.get(characterType);
      if (prefab) {
        this.currentCharacterNode = instantiate(prefab);
        this.currentCharacterNode.setParent(this.characterDisplay);
        this.currentCharacterNode.setPosition(0, 0, 0);
        this.currentCharacterNode.setScale(2, 2, 1);
      }
    }
  }

  private updateWeaponModel(weaponType: EntityTypeEnum) {
    if (this.currentWeaponNode) {
      this.currentWeaponNode.destroy();
      this.currentWeaponNode = null;
    }

    if (this.weaponDisplay) {
      const prefab = DataManager.Instance.prefabMap.get(weaponType);
      if (prefab) {
        this.currentWeaponNode = instantiate(prefab);
        this.currentWeaponNode.setParent(this.weaponDisplay);
        this.currentWeaponNode.setPosition(0, 0, 0);
        this.currentWeaponNode.setScale(2, 2, 1);
      }
    }
  }

  private onStartGame() {
    const selectedCharacter = this.characters[this.currentCharacterIndex];
    const selectedWeapon = this.weapons[this.currentWeaponIndex];
    const selectedBullet = selectedWeapon === EntityTypeEnum.Weapon1 ? EntityTypeEnum.Bullet1 : EntityTypeEnum.Bullet2;

    EventManager.Instance.emit(EventEnum.StartGameWithSelection, selectedCharacter, selectedWeapon, selectedBullet);
  }

  private onBack() {
    EventManager.Instance.emit(EventEnum.CloseCharacterSelect);
    this.node.active = false;
  }

  private cleanup() {
    if (this.prevCharacterButton && this.prevCharacterButton.node) {
      this.prevCharacterButton.node.off(Button.EventType.CLICK, this.onPrevCharacter, this);
    }
    if (this.nextCharacterButton && this.nextCharacterButton.node) {
      this.nextCharacterButton.node.off(Button.EventType.CLICK, this.onNextCharacter, this);
    }
    if (this.prevWeaponButton && this.prevWeaponButton.node) {
      this.prevWeaponButton.node.off(Button.EventType.CLICK, this.onPrevWeapon, this);
    }
    if (this.nextWeaponButton && this.nextWeaponButton.node) {
      this.nextWeaponButton.node.off(Button.EventType.CLICK, this.onNextWeapon, this);
    }
    if (this.startGameButton && this.startGameButton.node) {
      this.startGameButton.node.off(Button.EventType.CLICK, this.onStartGame, this);
    }
    if (this.backButton && this.backButton.node) {
      this.backButton.node.off(Button.EventType.CLICK, this.onBack, this);
    }

    if (this.currentCharacterNode) {
      this.currentCharacterNode.destroy();
      this.currentCharacterNode = null;
    }
    if (this.currentWeaponNode) {
      this.currentWeaponNode.destroy();
      this.currentWeaponNode = null;
    }
  }
}
