import type { Event, EventClass } from '../event';
import { EVENT_TYPE } from './event_type';

export const NewRoundEvent: EventClass<EVENT_TYPE.NEW_ROUND> = class implements Event {
    public type: EVENT_TYPE.NEW_ROUND = EVENT_TYPE.NEW_ROUND;
    public resendBoard = false;
    public getClientJSON() {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'message': 'A new round has begun',
        };
    }
}
