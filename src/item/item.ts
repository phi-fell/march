import * as t from 'io-ts';
import { ArmorData } from './armordata';
import { WeaponData } from './weapondata';

export type ItemSchema = t.TypeOf<typeof Item.schema>;

export class Item {
    public static schema = t.intersection([
        t.type({
            'id': t.string,
            'name': t.string,
            'sprite': t.string,
            'stackable': t.boolean,
            'count': t.number,
        }),
        t.partial({
            'weapon_data': WeaponData.schema,
            'armor_data': ArmorData.schema,
        }),
    ]);

    public static fromJSON(json: ItemSchema): Item {
        const ret = new Item(json.id, json.name, json.sprite, json.stackable, json.count);
        if (json.weapon_data) {
            ret.weapon_data = WeaponData.fromJSON(json.weapon_data);
        }
        if (json.armor_data) {
            ret.armor_data = ArmorData.fromJSON(json.armor_data);
        }
        return ret;
    }

    constructor(
        public id: string,
        public name: string,
        public sprite: string,
        public stackable: boolean,
        public count: number,
        public weapon_data?: WeaponData,
        public armor_data?: ArmorData,
    ) { }

    public toJSON(): ItemSchema {
        const ret: ItemSchema = {
            'id': this.id,
            'name': this.name,
            'sprite': this.sprite,
            'stackable': this.stackable,
            'count': this.count,
        }
        if (this.weapon_data) {
            ret.weapon_data = this.weapon_data.toJSON();
        }
        if (this.armor_data) {
            ret.armor_data = this.armor_data.toJSON();
        }
        return ret;
    }
}
