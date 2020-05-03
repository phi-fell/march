import * as t from 'io-ts';
import { Random, UUID } from '../math/random';
import type { Entity } from '../world/entity';
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
        const ret = new Item(json.name, json.sprite, json.stackable, json.count);
        ret.id = json.id;
        if (json.weapon_data) {
            ret.weapon_data = WeaponData.fromJSON(json.weapon_data);
        }
        if (json.armor_data) {
            ret.armor_data = ArmorData.fromJSON(json.armor_data);
        }
        return ret;
    }

    public id: UUID = Random.uuid();
    constructor(
        public name: string,
        public sprite: string,
        public stackable: boolean,
        public count: number,
        public weapon_data?: WeaponData,
        public armor_data?: ArmorData,
    ) { }

    public tryStack(other: Item): boolean {
        if (this.stackable && this.equals(other)) {
            this.count += other.count;
            other.count = 0;
            return true;
        }
        return false;
    }

    public equals(other: Item) {
        return this.name === other.name &&
            this.sprite === other.sprite &&
            this.stackable === other.stackable &&
            ((this.weapon_data === undefined && other.weapon_data === undefined) ||
                (this.weapon_data && other.weapon_data && this.weapon_data.equals(other.weapon_data))) &&
            ((this.armor_data === undefined && other.armor_data === undefined) ||
                (this.armor_data && other.armor_data && this.armor_data.equals(other.armor_data)));
    }

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
    public getClientJSON(viewer: Entity) {
        return this.toJSON();
    }
}
