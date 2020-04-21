import type { ActionClass } from '../action';
import { ChatDirections, DIRECTION, directionVectors, getRelativeDirection, RELATIVE_DIRECTION } from '../direction';
import type { Entity } from '../entity';
import { StrafeEvent } from '../event/strafe_event';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';
import { BackstepAction } from './backstep_action';
import { MoveAction } from './move_action';

export const StrafeAction: ActionClass<ACTION_TYPE.STRAFE> = class extends ActionBase {
    public static arg_count = 1;
    public static fromArgs(args: string[]) {
        if (args.length < 1) {
            return 'Provide a direction!';
        }
        const chat_dir = args[0];
        const dir = ChatDirections[chat_dir];
        if (dir !== undefined) {
            return new StrafeAction(dir);
        }
        return `${chat_dir} is not a valid direction!`;
    }
    public type: ACTION_TYPE.STRAFE = ACTION_TYPE.STRAFE;
    public readonly cost: number = 8;
    constructor(public direction: DIRECTION) {
        super();
    }
    public perform(entity: Entity) {
        const vec = directionVectors[this.direction];
        const newLoc = entity.location.translate(vec.x, vec.y);

        // if tile is not passable
        // return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };

        // if there is a mob in the way
        // return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };

        if (entity.sheet === undefined) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        const rel_dir = getRelativeDirection(entity.direction, this.direction);
        if (rel_dir === RELATIVE_DIRECTION.FORWARD) {
            return (new MoveAction(this.direction)).perform(entity);
        }
        if (rel_dir === RELATIVE_DIRECTION.BACKWARD) {
            return (new BackstepAction(this.direction)).perform(entity);
        }
        if (entity.sheet.hasSufficientAP(this.cost)) {
            entity.location.cell.emit(new StrafeEvent(entity, this.direction), entity.location, newLoc);
            entity.setLocation(newLoc);
            return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
        }
        return { 'result': ACTION_RESULT.INSUFFICIENT_AP, 'cost': 0 };
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
            'direction': DIRECTION[this.direction],
        };
    }
}
