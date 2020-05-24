import * as t from 'io-ts';
import { ArmorData } from './armordata';
import { Item } from './item';

export interface Armor extends Item {
    armor_data: ArmorData;
    toJSON(): ArmorSchema;
}

const armor_schema = t.intersection([
    Item.schema,
    t.type({
        'armor_data': ArmorData.schema,
    }),
]);

export type ArmorSchema = t.TypeOf<typeof armor_schema>;

export const Armor = {
    'schema': armor_schema,
    'fromJSON': (json: ArmorSchema) => {
        const item = Item.fromJSON(json);
        if (!item.isArmor()) {
            console.log('ERROR: Non Armor Item constructed from Armor JSON!');
        }
        return item as Armor;
    }
}
