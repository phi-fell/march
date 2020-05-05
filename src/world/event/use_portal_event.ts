import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class UsePortalEvent {
    public type: EVENT_TYPE.USE_PORTAL = EVENT_TYPE.USE_PORTAL;
    constructor(private entity: Entity) { }
    public getClientJSON(viewer: Entity) {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'entity_id': this.entity.id,
        };
    }
}
