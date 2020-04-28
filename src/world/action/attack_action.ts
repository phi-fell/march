import { ChatDirections, DIRECTION, directionVectors } from '../direction';
import type { Entity } from '../entity';
import { AttackEvent } from '../event/attack_event';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export class AttackAction extends ActionBase {
    public static fromArgs(args: string[]) {
        if (args.length < 1) {
            return new AttackAction();
        }
        const chat_dir = args[0];
        const dir = ChatDirections[chat_dir];
        if (dir !== undefined) {
            return new AttackAction(dir);
        }
        return `${chat_dir} is not a valid direction!`;
    }
    public type: ACTION_TYPE.ATTACK = ACTION_TYPE.ATTACK;
    public readonly cost: number = 10;
    constructor(public direction?: DIRECTION) {
        super();
    }
    public perform(entity: Entity) {
        const [direction, sheet] = entity.getComponents('direction', 'sheet');
        if (sheet === undefined) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        if (direction !== undefined && this.direction !== undefined && direction !== this.direction) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        const dir = (direction !== undefined) ? direction : (this.direction);
        if (dir === undefined) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }

        const vec = directionVectors[dir];
        const attackLoc = entity.location.translate(vec.x, vec.y);
        const ents = attackLoc.getEntitiesAt().filter((e) => e.isCollidable());
        if (ents.length > 1) {
            console.log('Multiple collidable entities at same location!');
        }
        const ent = (ents.length >= 1) ? (ents[0]) : undefined;

        if (sheet.hasSufficientAP(this.cost)) {
            const attack_event = new AttackEvent(entity, ent);
            if (ent !== undefined) {
                const defender_sheet = ent.getComponent('sheet');
                if (defender_sheet) {
                    defender_sheet.takeHit(attack_event);
                }
            }
            entity.location.cell.emit(attack_event, entity.location, attackLoc);
            return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
        }
        return { 'result': ACTION_RESULT.INSUFFICIENT_AP, 'cost': 0 };
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
            'direction': (this.direction === undefined) ? undefined : (DIRECTION[this.direction]),
        };
    }
}
