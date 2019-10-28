import { Item } from './item';

interface ItemStack {
    item: Item;
    count: number;
}

export class Inventory {
    private _items: ItemStack[] = [];
    constructor() { /* nothing */ }
    public addItem(item: Item, count: number = 1) {
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
}
