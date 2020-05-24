import { DIRECTION } from '../direction';
import type { Entity } from '../entity';
import type { Location } from '../location';
import { EVENT_TYPE } from './event_type';

export class MoveEvent {
    public type: EVENT_TYPE.MOVE = EVENT_TYPE.MOVE;
    constructor(private entity: Entity, private toLoc: Location, private direction: DIRECTION) { }
    public getClientJSON(viewer: Entity) {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'entity_id': this.entity.id,
            'location': this.toLoc.getClientJSON(viewer),
            'direction': DIRECTION[this.direction],
        };
    }
}
