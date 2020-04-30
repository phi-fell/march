import * as t from 'io-ts';
import { EQUIPMENT_SLOT } from '../item/equipment_slot';

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

class Item {
    public static schema = t.any;
    public static fromJSON(json: any) {
        return new Item();
    }
    public toJSON() {
        return {};
    }
}

const equipment_schema = t.partial(Object.keys(EQUIPMENT_SLOT).reduce((all, equip) => {
    if (isNaN(Number(equip))) {
        all[equip as keyof typeof EQUIPMENT_SLOT] = Item.schema;
    }
    return all;
}, {} as Record<keyof typeof EQUIPMENT_SLOT, typeof Item.schema>));
type EquipmentSchema = t.TypeOf<typeof equipment_schema>;

export type CharacterEquipmentSchema = t.TypeOf<typeof CharacterEquipment.schema>;

export class CharacterEquipment {
    public static schema = equipment_schema;
    public static fromJSON(json: CharacterEquipmentSchema) {
        const ret = new CharacterEquipment();
        if (!json) {
            return ret;
        }
        for (const slot of Object.keys(json)) {
            const item = json[slot as keyof typeof EQUIPMENT_SLOT];
            if (item) {
                ret.equipment[EQUIPMENT_SLOT[slot as keyof typeof EQUIPMENT_SLOT]] = Item.fromJSON(item);
            }
        }
        return ret;
    }
    // public shield: Shield | null;
    private equipment: (Item | undefined)[] = [];
    public get weapon(): any | null {
        const ret = this.equipment[EQUIPMENT_SLOT.WEAPON];
        return ret ? (ret as any) : (null);
    }
    public set weapon(weapon: any | null) {
        this.equipment[EQUIPMENT_SLOT.WEAPON] = weapon || undefined;
    }
    public getEquipment(slot: EQUIPMENT_SLOT): Item | null {
        return this.equipment[slot] || null;
    }
    public equipWeapon(weapon: any | null) {
        if (!weapon) {
            return;
        }
        this.equipment[EQUIPMENT_SLOT.WEAPON] = weapon;
    }
    public equipArmor(armor: any | null) {
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
        this.equipment[slot] = undefined;
        return ret;
    }
    public toJSON(): CharacterEquipmentSchema {
        return this.equipment.reduce(
            (equipped: EquipmentSchema, item: Item | undefined, slot: EQUIPMENT_SLOT): EquipmentSchema => {
                equipped[EQUIPMENT_SLOT[slot] as keyof typeof EQUIPMENT_SLOT] = item?.toJSON();
                return equipped;
            },
            {} as EquipmentSchema,
        );
    }
}
