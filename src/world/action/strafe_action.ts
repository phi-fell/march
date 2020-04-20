import type { ActionClass } from '../action';
import { ChatDirections, DIRECTION, directionVectors } from '../direction';
import type { Entity } from '../entity';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

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
        const cost = (entity.direction === this.direction) ? 5 : (this.cost);
        if (entity.sheet.hasSufficientAP(cost)) {
            // emit events when that's implemented
            entity.setLocation(newLoc);
            return { 'result': ACTION_RESULT.SUCCESS, cost };
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
