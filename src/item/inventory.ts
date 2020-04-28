import * as t from 'io-ts';

export type InventorySchema = t.TypeOf<typeof Inventory.schema>;

export class Inventory {
    public static schema = t.any;

    public static fromJSON(json: InventorySchema): Inventory {
        return new Inventory()
    }
    constructor() { /* nothing */ }
    public toJSON(): InventorySchema {
        return [];
    }
}
