import { Armor } from '../item/armor';
import { EQUIPMENT_SLOT } from '../item/equipment_slot';
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

export class CharacterEquipment {
    public static fromJSON(json: any) {
        const ret = new CharacterEquipment();
        if (!json) {
            return ret;
        }
        ret.inventory = Inventory.fromJSON(json.inventory);
        if (json.equipped) {
            for (const slot of Object.keys(json.equipped)) {
                ret.equipment[EQUIPMENT_SLOT[slot as keyof typeof EQUIPMENT_SLOT]] = Item.fromJSON(json.equipped[slot]);
            }
        }
        return ret;
    }
    // public shield: Shield | null;
    public inventory: Inventory;
    private equipment: { [slot: number]: Item | null; } = {};
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
    public getEquipment(slot: EQUIPMENT_SLOT): Item | null {
        return this.equipment[slot] || null;
    }
    public equipWeapon(weapon: Weapon | null) {
        if (!weapon) {
            return;
        }
        this.inventory.addItem(this.equipment[EQUIPMENT_SLOT.WEAPON]);
        this.equipment[EQUIPMENT_SLOT.WEAPON] = weapon;
    }
    public equipArmor(armor: Armor | null) {
        if (!armor) {
            return;
        }
        this.unequip(armor.armor_data.slot);
        this.equipment[armor.armor_data.slot] = armor;
    }
    public unequip(slot: EQUIPMENT_SLOT): boolean {
        let ret = false;
        if (this.equipment[slot]) {
            ret = true;
        }
        this.inventory.addItem(this.equipment[slot]);
        this.equipment[slot] = null;
        return ret;
    }
    public toJSON() {
        const equipped: { [id: string]: any; } = {};
        for (const slot_name in EQUIPMENT_SLOT) {
            if (isNaN(Number(slot_name))) {
                const item = this.equipment[EQUIPMENT_SLOT[slot_name as keyof typeof EQUIPMENT_SLOT]];
                equipped[slot_name as keyof typeof EQUIPMENT_SLOT] = item && item.toJSON();
            }
        }
        return {
            equipped,
            'inventory': this.inventory.toJSON(),
        };
    }
}
