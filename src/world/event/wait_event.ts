import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class WaitEvent {
    public type: EVENT_TYPE.WAIT = EVENT_TYPE.WAIT;
    constructor(private entity: Entity) { }
    public getClientJSON(viewer: Entity) {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'message': `${this.entity.getComponent('name')} is waiting`,
        };
    }
}
