import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class WaitOnceEvent {
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
