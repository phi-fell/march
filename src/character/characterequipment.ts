import { Inventory } from '../item/inventory';
import { Item } from '../item/item';
import { Weapon } from '../item/weapon';

/*
export enum EQUIPMENT_SLOT {
    // weapons/ held
    LEFT_HAND, RIGHT_HAND,
    // armor/clothes
    HEAD,
    LEFT_EAR, RIGHT_EAR,
    NECKLACE,
    SHIRT,
    CLOAK,
    LEFT_WRIST, RIGHT_WRIST,
    THROAT_ARMOR,
    CHEST_ARMOR,
    LEFT_SHOULDER_ARMOR, RIGHT_SHOULDER_ARMOR,
    LEFT_UPPER_ARM_ARMOR, RIGHT_UPPER_ARM_ARMOR,
    LEFT_ELBOW_ARMOR, RIGHT_ELBOW_ARMOR,
    LEFT_FOREARM_ARMOR, RIGHT_FOREARM_ARMOR,
    LEFT_HAND_ARMOR, RIGHT_HAND_ARMOR,
    LEFT_RING_POINTERFINGER, RIGHT_RING_POINTERFINGER,
    LEFT_RING_MIDDLEFINGER, RIGHT_RING_MIDDLEFINGER,
    LEFT_RING_RINGFINGER, RIGHT_RING_RINGFINGER,
    LEFT_RING_PINKY, RIGHT_RING_PINKY,
    BELT,
    PANTS,
    LEFT_THIGH_ARMOR, RIGHT_THIGH_ARMOR,
    LEFT_KNEE_ARMOR, RIGHT_KNEE_ARMOR,
    LEFT_SHIN_ARMOR, RIGHT_SHIN_ARMOR,
    LEFT_FOOT, RIGHT_FOOT,
}*/

export enum EQUIPMENT_SLOT {
    WEAPON = 0,
    SHIELD = 1,
    HELMET = 2,
    CHEST_ARMOR = 3,
    LEG_ARMOR = 4,
    BOOTS = 5,
    GLOVES = 6,
    BELT = 7,
    NECKLACE = 8,
    RING = 9,
    RING_ALT = 10,
}

export class CharacterEquipment {
    public static fromJSON(json) {
        const ret = new CharacterEquipment();
        if (!json) {
            return ret;
        }
        if (json.weapon) {
            ret.weapon = new Weapon(json.weapon.schema, '');
        }
        ret.inventory = Inventory.fromJSON(json.inventory);
        return ret;
    }
    // public shield: Shield | null;
    public inventory: Inventory;
    private equipment: { [id: number]: Item | null; } = {};
    constructor() {
        this.inventory = new Inventory();
    }
    public get weapon(): Weapon | null {
        const ret = this.equipment[EQUIPMENT_SLOT.WEAPON];
        return ret ? (ret as Weapon) : (null);
    }
    public set weapon(weapon: Weapon | null) {
        this.inventory.addItem(this.equipment[EQUIPMENT_SLOT.WEAPON]);
        this.equipment[EQUIPMENT_SLOT.WEAPON] = weapon;
    }
    public toJSON() {
        return {
            'weapon': (this.weapon) ? this.weapon.toJSON() : (this.weapon),
            'inventory': this.inventory.toJSON(),
        };
    }
}
