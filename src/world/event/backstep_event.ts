import type { Entity } from '../entity';
import type { Location } from '../location';
import { EVENT_TYPE } from './event_type';

export class BackstepEvent {
    public type: EVENT_TYPE.BACKSTEP = EVENT_TYPE.BACKSTEP;
    constructor(private entity: Entity, private toLoc: Location) { }
    public getClientJSON(viewer: Entity) {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'entity_id': this.entity.id,
            'location': this.toLoc.getClientJSON(viewer),
        };
    }
}
