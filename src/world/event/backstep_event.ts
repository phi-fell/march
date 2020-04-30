import type { DIRECTION } from '../direction';
import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class BackstepEvent {
    public type: EVENT_TYPE.BACKSTEP = EVENT_TYPE.BACKSTEP;
    constructor(private entity: Entity, private direction: DIRECTION) { }
    public getClientJSON() {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'message': `${this.entity.getComponent('name')} steps backward`,
        };
    }
}
