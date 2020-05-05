import type { Inventory } from '../../item/inventory';
import type { Item } from '../../item/item';
import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class DropEvent {
    public type: EVENT_TYPE.DROP = EVENT_TYPE.DROP;
    constructor(private entity: Entity, private item: Item, private inventory: Inventory) { }
    public getClientJSON(viewer: Entity) {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'entity_id': this.entity.id,
            'item': this.item.getClientJSON(viewer),
            'inventory': this.inventory.getClientJSON(viewer),
        };
    }
}
