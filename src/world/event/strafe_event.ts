import { DIRECTION, getRelativeDirection, RELATIVE_DIRECTION } from '../direction';
import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class StrafeEvent {
    public type: EVENT_TYPE.STRAFE = EVENT_TYPE.STRAFE;
    public resendBoard = true;
    constructor(private entity: Entity, private direction: DIRECTION) { }
    public getClientJSON() {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'message': `${this.entity.getName()} sidesteps ${RELATIVE_DIRECTION[getRelativeDirection(this.entity.direction, this.direction)].toLowerCase()}`,
        };
    }
}
