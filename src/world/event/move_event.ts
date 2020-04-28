import type { DIRECTION } from '../direction';
import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class MoveEvent {
    public type: EVENT_TYPE.MOVE = EVENT_TYPE.MOVE;
    constructor(private entity: Entity, private direction: DIRECTION) { }
    public getClientJSON() {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'message': `${this.entity.getComponent('name')} moves ${['North', 'West', 'South', 'East'][this.direction]}`,
        };
    }
}
