import { Item, ITEM_TYPE, ItemSchema } from './item';

export interface WeaponSchema extends ItemSchema {
    item_type: ITEM_TYPE.WEAPON;
    one_handed: boolean;
    sharpness: number;
    force: number;
    precision: number;
    speed: number;
}
