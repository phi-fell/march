import type { Entity, Mob } from '../entity';
import { EVENT_TYPE } from './event_type';

export class StatusChangeEvent {
    public type: EVENT_TYPE.STATUS_CHANGE = EVENT_TYPE.STATUS_CHANGE;
    constructor(private entity: Mob, ) { }
    public getClientJSON(viewer: Entity) {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'entity_id': this.entity.id,
            'status': this.entity.getComponent('sheet').status.toJSON(),
        };
    }
}
