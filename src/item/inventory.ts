import { Item } from './item';

export interface ItemStack {
    item: Item;
    count: number;
}

export class Inventory {
    public static fromJSON(json: any): Inventory {
        const ret = new Inventory();
        for (const stack of json) {
            if (stack.item.schema) {
                ret.addItem(Item.fromJSON(stack.item), stack.count);
            } else {
                ret.addItem(Item.getItemFromSchemaID(stack.item), stack.count);
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
    public removeItemFromSlot(slot: number, count: number | null = null): ItemStack | null {
        if (slot < 0 || slot >= this._items.length) {
            console.log('no such item index to remove');
            return null;
        }
        if (!count || !this._items[slot].count || count >= this._items[slot].count) {
            return this._items.splice(slot, 1)[0];
        }
        this._items[slot].count -= count;
        return {
            'item': this._items[slot].item.clone(),
            count,
        };
    }
    public removeItemById(id: string): Item | null {
        for (let i = 0; i < this._items.length; i++) {
            if (this._items[i].item.id === id) {
                const stack = this._items[i];
                const ret = stack.item;
                stack.count--;
                if (stack.count) {
                    stack.item = stack.item.clone();
                } else {
                    this._items.splice(i, 1);
                }
                return ret;
            }
        }
        return null;
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
