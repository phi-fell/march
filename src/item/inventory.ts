import * as t from 'io-ts';
import { Item } from './item';

export type InventorySchema = t.TypeOf<typeof Inventory.schema>;

export class Inventory {
    public static schema = t.array(Item.schema);

    public static fromJSON(json: InventorySchema): Inventory {
        const ret = new Inventory();
        for (const item_json of json) {
            ret.addItem(Item.fromJSON(item_json));
        }
        return ret;
    }
    private items: Item[] = [];
    constructor() { /* nothing */ }
    public addItem(item: Item) {
        this.items.push(item);
    }
    public toJSON(): InventorySchema {
        return this.items.map((item) => item.toJSON());
    }
}
