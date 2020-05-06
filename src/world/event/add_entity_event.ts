import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class AddEntityEvent {
    public type: EVENT_TYPE.ADD_ENTITY = EVENT_TYPE.ADD_ENTITY;
    constructor(public entity: Entity) { }
    public getClientJSON(viewer: Entity) {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'entity': this.entity.getClientJSON(viewer),
        };
    }
}
