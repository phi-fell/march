import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class DeathEvent {
    public type: EVENT_TYPE.DEATH = EVENT_TYPE.DEATH;
    constructor(private entity: Entity) { }
    public getClientJSON(viewer: Entity) {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'entity_id': this.entity.id,
            'message': `${this.entity.getComponent('name')} has died`,
        };
    }
}
