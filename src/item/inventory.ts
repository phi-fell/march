import * as t from 'io-ts';
import type { UUID } from '../math/random';
import { Entity } from '../world/entity';
import type { Location } from '../world/location';
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
        if (item.stackable) {
            for (const it of this.items) {
                if (it.tryStack(item)) {
                    return;
                }
            }
        }
        this.items.push(item);
    }
    public hasItemByID(item_id: UUID): boolean {
        return this.items.find((item) => item.id === item_id) !== undefined;
    }
    public removeAndReturnItemByID(item_id: UUID): Item | undefined {
        const index = this.items.findIndex((item) => item.id === item_id);
        if (index < 0) {
            return;
        }
        return this.items.splice(index, 1)[0];
    }
    public dropAll(loc: Location) {
        this.items.forEach((item: Item) => {
            Entity.createItemEntity(item, loc);
        });
        this.items = [];
    }
    public toJSON(): InventorySchema {
        return this.items.map((item) => item.toJSON());
    }
}
