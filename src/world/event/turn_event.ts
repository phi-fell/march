import { DIRECTION, getRelativeDirection, RELATIVE_DIRECTION } from '../direction';
import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class TurnEvent {
    public type: EVENT_TYPE.TURN = EVENT_TYPE.TURN;
    constructor(private entity: Entity, private from: DIRECTION, private to: DIRECTION) { }
    public getClientJSON(viewer: Entity) {
        const rel_dir = getRelativeDirection(this.from, this.to);
        const message: string = (() => {
            switch (rel_dir) {
                case RELATIVE_DIRECTION.FORWARD:
                    return 'turns to face the same direction';
                case RELATIVE_DIRECTION.LEFT:
                    return 'turns to their left';
                case RELATIVE_DIRECTION.BACKWARD:
                    return 'turns around'
                case RELATIVE_DIRECTION.RIGHT:
                    return 'turns to their right';
            }
        })();
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'message': `${this.entity.getComponent('name')} ${message}`,
        };
    }
}
