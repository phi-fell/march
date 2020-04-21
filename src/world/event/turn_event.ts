import type { DIRECTION } from '../direction';
import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class TurnEvent {
    public type: EVENT_TYPE.TURN = EVENT_TYPE.TURN;
    public resendBoard = true;
    constructor(private entity: Entity, private direction: DIRECTION) { }
    public getClientJSON() {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'message': `${this.entity.getName()} turns ${['North', 'West', 'South', 'East'][this.direction]}`,
        };
    }
}
