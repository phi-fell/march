import * as t from 'io-ts';
import type { Item } from '../world/entity';

export type InventorySchema = t.TypeOf<typeof Inventory.schema>;

export class Inventory {
    public static schema = t.any;

    public static fromJSON(json: InventorySchema): Inventory {
        return new Inventory()
    }
    private items: Item[] = [];
    constructor() { /* nothing */ }
    public toJSON(): InventorySchema {
        return [];
    }
}
