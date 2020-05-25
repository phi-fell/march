import { DIRECTION, directionVectors } from '../direction';
import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class LookEvent {
    public type: EVENT_TYPE.LOOK = EVENT_TYPE.LOOK;
    constructor(private entity: Entity, private direction?: DIRECTION) { }
    public getClientJSON(viewer: Entity) {
        const vec = (this.direction !== undefined) ? (directionVectors[this.direction]) : { 'x': 0, 'y': 0 };
        const loc = this.entity.location.translate(vec.x, vec.y);
        const ents = loc.getEntitiesAt().map((ent) => ent.getComponent('name')).filter((name) => name !== undefined) as string[];
        let message;
        if (ents.length === 0) {
            message = 'You see nothing';
        } else if (ents.length === 1) {
            message = `You see something: ${ents[0]}`;
        } else {
            message = `You see several things: ${ents.join(', ')}`;
        }
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            message,
        };
    }
}
