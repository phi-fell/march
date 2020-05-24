import * as t from 'io-ts';
import { Armor } from '../item/armor';
import { ARMOR_SLOT } from '../item/armor_slot';
import type { Inventory } from '../item/inventory';
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

const armor_set_schema = t.partial(Object.keys(ARMOR_SLOT).reduce((all, equip) => {
    if (isNaN(Number(equip))) {
        all[equip as keyof typeof ARMOR_SLOT] = Armor.schema;
    }
    return all;
}, {} as Record<keyof typeof ARMOR_SLOT, typeof Armor.schema>));
type ArmorSetSchema = t.TypeOf<typeof armor_set_schema>;

export type CharacterEquipmentSchema = t.TypeOf<typeof CharacterEquipment.schema>;

export class CharacterEquipment {
    public static schema = t.type({
        'armor': armor_set_schema,
        'weapon': t.union([Weapon.schema, t.undefined]),
    });
    public static fromJSON(json: CharacterEquipmentSchema) {
        const ret = new CharacterEquipment();
        if (!json) {
            return ret;
        }
        if (json.weapon !== undefined) {
            ret.weapon = Weapon.fromJSON(json.weapon);
        }
        for (const slot of Object.keys(json)) {
            const item = json.armor[slot as keyof typeof ARMOR_SLOT];
            if (item !== undefined) {
                ret.armor[ARMOR_SLOT[slot as keyof typeof ARMOR_SLOT]] = Armor.fromJSON(item);
            }
        }
        return ret;
    }
    private armor: (Armor | undefined)[] = [];
    private weapon: Weapon | undefined;
    public getWeapon(): Weapon | undefined {
        return this.weapon;
    }
    public getArmor(slot: ARMOR_SLOT): Armor | undefined {
        return this.armor[slot];
    }
    public equipWeapon(weapon: Weapon, inventory: Inventory) {
        this.unequipWeapon(inventory);
        this.weapon = weapon;
    }
    public equipArmor(armor: Armor, inventory: Inventory) {
        this.unequipArmor(armor.armor_data.slot, inventory);
        this.armor[armor.armor_data.slot] = armor;
    }
    public unequipArmor(slot: ARMOR_SLOT, inventory: Inventory) {
        const armor = this.armor[slot];
        if (armor !== undefined) {
            inventory.addItem(armor);
            this.armor[slot] = undefined;
        }
    }
    public unequipWeapon(inventory: Inventory) {
        const weapon = this.weapon;
        if (weapon !== undefined) {
            inventory.addItem(weapon);
            this.weapon = undefined;
        }
    }
    public toJSON(): CharacterEquipmentSchema {
        return {
            'weapon': this.weapon?.toJSON(),
            'armor': this.armor.reduce(
                (equipped: ArmorSetSchema, item: Armor | undefined, slot: ARMOR_SLOT): ArmorSetSchema => {
                    equipped[ARMOR_SLOT[slot] as keyof typeof ARMOR_SLOT] = item?.toJSON();
                    return equipped;
                },
                {} as ArmorSetSchema,
            ),
        }
    }
}
