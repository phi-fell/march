import { Apparel } from './apparel';
import { Item } from './item';
import { ITEM_TYPE } from './itemtype';
import { Weapon } from './weapon';

export function getItemFromSchemaID(schemaID): Item | null {
    const type = Item.getItemType(schemaID);
    if (type === null) {
        console.log('Item schema does not exist: ' + schemaID);
        return null;
    }
    switch (type) {
        case ITEM_TYPE.WEAPON:
            return new Weapon(schemaID, '');
            break;
        case ITEM_TYPE.APPAREL:
            return new Apparel(schemaID, '');
            break;
        case ITEM_TYPE.MISC:
            return new Item(schemaID);
            break;
    }
}
