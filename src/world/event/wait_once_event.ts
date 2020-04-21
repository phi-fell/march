import type { Entity } from '../entity';
import type { EventClass } from '../event';
import { EVENT_TYPE } from './event_type';

export const WaitOnceEvent: EventClass<EVENT_TYPE.WAIT_ONCE> = class {
    public type: EVENT_TYPE.WAIT_ONCE = EVENT_TYPE.WAIT_ONCE;
    public resendBoard = false;
    constructor(private entity: Entity) { }
    public getClientJSON() {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'message': `${this.entity.getName()} hesitates`,
        };
    }
}
