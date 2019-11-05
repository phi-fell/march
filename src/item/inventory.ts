import { Item } from './item';
import { getItemFromSchemaID } from './itemutil';

export interface ItemStack {
    item: Item;
    count: number;
}

export class Inventory {
    public static fromJSON(json: any): Inventory {
        const ret = new Inventory();
        for (const stack of json) {
            if (stack.item.schema) {
                ret.addItem(getItemFromSchemaID(stack.item.schema), stack.count);
            } else {
                ret.addItem(getItemFromSchemaID(stack.item), stack.count);
            }
        }
        return ret;
    }
    private _items: ItemStack[] = [];
    constructor() { /* nothing */ }
    public addItem(item: Item | null, count: number = 1) {
        if (!item) {
            return;
        }
        for (const stack of this._items) {
            if (stack.item.schema === item.schema && stack.item.stackable) {
                stack.count += count;
                return;
            }
        }
        this._items.push({
            'item': item,
            'count': count,
        });
    }
    public removeItem(slot: number, count: number | null = null) {
        if (slot < 0 || slot >= this._items.length) {
            return console.log('no such item index to remove');
        }
        if (!count || !this._items[slot].count || count >= this._items[slot].count) {
            return this._items.splice(slot, 1);
        }
        this._items[slot].count -= count;
    }
    public getItemStack(slot: number): ItemStack {
        return this._items[slot];
    }
    get stacks() {
        return this._items.length;
    }
    public toJSON() {
        const ret: any[] = [];
        for (const stack of this._items) {
            ret.push({
                'item': stack.item.toJSON(),
                'count': stack.count,
            });
        }
        return ret;
    }
}
