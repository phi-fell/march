import type { ActionClass } from '../action';
import { ChatDirections, DIRECTION } from '../direction';
import type { Entity } from '../entity';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export const TurnAction: ActionClass<ACTION_TYPE.TURN> = class extends ActionBase {
    public static arg_count = 1;
    public static fromArgs(args: string[]) {
        if (args.length < 1) {
            return 'Provide a direction!';
        }
        const chat_dir = args[0];
        const dir = ChatDirections[chat_dir];
        if (dir !== undefined) {
            return new TurnAction(dir);
        }
        return `${chat_dir} is not a valid direction!`;
    }
    public type: ACTION_TYPE.TURN = ACTION_TYPE.TURN;
    public readonly cost: number = 5;
    constructor(public direction: DIRECTION) {
        super();
    }
    public perform(entity: Entity) {
        if (entity.direction === this.direction) {
            return { 'result': ACTION_RESULT.REDUNDANT, 'cost': 0 };
        }
        if (entity.sheet === undefined) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        if (entity.sheet.hasSufficientAP(this.cost)) {
            // emit events when that's implemented
            entity.direction = this.direction;
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
