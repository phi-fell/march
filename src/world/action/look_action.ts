import type { ActionClass } from '../action';
import { ChatDirections, DIRECTION } from '../direction';
import type { Entity } from '../entity';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export const LookAction: ActionClass<ACTION_TYPE.LOOK> = class extends ActionBase {
    public static arg_count = 1;
    public static fromArgs(args: string[]) {
        if (args.length < 1) {
            return 'Provide a direction!';
        }
        const chat_dir = args[0];
        const dir = ChatDirections[chat_dir];
        if (dir !== undefined) {
            return new LookAction(dir);
        }
        return `${chat_dir} is not a valid direction!`;
    }
    public type: ACTION_TYPE.LOOK = ACTION_TYPE.LOOK;
    public readonly cost: number = 0;
    constructor(public direction: DIRECTION) {
        super();
    }
    public perform(entity: Entity) {
        entity.look(this.direction);
        return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
            'direction': DIRECTION[this.direction],
        };
    }
}
