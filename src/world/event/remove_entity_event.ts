import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class RemoveEntityEvent {
    public type: EVENT_TYPE.REMOVE_ENTITY = EVENT_TYPE.REMOVE_ENTITY;
    constructor(public entity: Entity) { }
    public getClientJSON(viewer: Entity) {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'id': this.entity.id,
        };
    }
}
