import * as t from 'io-ts';
import { Item } from './item';
import { WeaponData } from './weapondata';

export interface Weapon extends Item {
    weapon_data: WeaponData;
    toJSON(): WeaponSchema;
}

const weapon_schema = t.intersection([
    Item.schema,
    t.type({
        'weapon_data': WeaponData.schema,
    }),
]);

export type WeaponSchema = t.TypeOf<typeof weapon_schema>;

export const Weapon = {
    'schema': weapon_schema,
    'fromJSON': (json: WeaponSchema) => {
        const item = Item.fromJSON(json);
        if (!item.isWeapon()) {
            console.log('ERROR: Non Weapon Item constructed from Weapon JSON!');
        }
        return item as Weapon;
    }
}
