import type { Item } from '../../item/item';
import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class DropEvent {
    public type: EVENT_TYPE.DROP = EVENT_TYPE.DROP;
    constructor(private entity: Entity, private item: Item) { }
    public getClientJSON() {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'message': `${this.entity.getComponent('name')} drops the ${this.item.name}`,
        };
    }
}
