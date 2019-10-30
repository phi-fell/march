import { Inventory } from '../item/inventory';
import { Weapon } from '../item/weapon';

export enum APPAREL_SLOT {
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
    LEFT_HAND, RIGHT_HAND,
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
}

export class CharacterEquipment {
    public static fromJSON(json) {
        const ret = new CharacterEquipment();
        if (!json) {
            return ret;
        }
        ret.inventory = Inventory.fromJSON(json.inventory);
        return ret;
    }
    // public helmet: Apparel;
    // public chest_armor: Apparel;
    // public leg_armor: Apparel;
    // public boots: Apparel;
    public weapon: Weapon | null;
    public inventory: Inventory;
    constructor() {
        this.weapon = new Weapon('sword');
        this.inventory = new Inventory();
        this.inventory.addItem(new Weapon('sword'));
    }
    public toJSON() {
        return {
            'weapon': (this.weapon) ? this.weapon.toJSON() : (this.weapon),
            'inventory': this.inventory.toJSON(),
        };
    }
}
