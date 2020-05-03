import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class NewRoundEvent {
    public type: EVENT_TYPE.NEW_ROUND = EVENT_TYPE.NEW_ROUND;
    public getClientJSON(viewer: Entity) {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'message': 'A new round has begun',
        };
    }
}
