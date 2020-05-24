import { RELATIVE_DIRECTION } from '../direction';
import type { Entity } from '../entity';
import type { Location } from '../location';
import { EVENT_TYPE } from './event_type';

export class StrafeEvent {
    public type: EVENT_TYPE.STRAFE = EVENT_TYPE.STRAFE;
    constructor(private entity: Entity, private toLoc: Location, private rel_dir: RELATIVE_DIRECTION) { }
    public getClientJSON(viewer: Entity) {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'entity_id': this.entity.id,
            'location': this.toLoc.getClientJSON(viewer),
            'rel_dir': RELATIVE_DIRECTION[this.rel_dir],
        };
    }
}
