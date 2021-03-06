import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class WaitRoundEvent {
    public type: EVENT_TYPE.WAIT_ROUND = EVENT_TYPE.WAIT_ROUND;
    constructor(private entity: Entity) { }
    public getClientJSON(viewer: Entity) {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'message': `${this.entity.getComponent('name')} is waiting`,
        };
    }
}
