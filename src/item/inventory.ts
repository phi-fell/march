import { Item } from './item';

interface ItemStack {
    item: Item;
    count: number;
}

export class Inventory {
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
