import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class MessageEvent {
    public type: EVENT_TYPE.MESSAGE = EVENT_TYPE.MESSAGE;
    constructor(private message: string) { }
    public getClientJSON(viewer: Entity) {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'message': this.message,
        };
    }
}
