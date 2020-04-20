import type { ActionClass } from '../action';
import { ChatDirections, DIRECTION } from '../direction';
import type { Entity } from '../entity';
import type { World } from '../world';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export const LookAction: ActionClass<ACTION_TYPE.LOOK> = class extends ActionBase {
    public static arg_count = 1;
    public static fromArgs(world: World, entity: Entity, args: string[]) {
        if (args.length < 1) {
            return 'Provide a direction!';
        }
        const chat_dir = args[0];
        const dir = ChatDirections[chat_dir];
        if (dir) {
            return new LookAction(world, entity, dir);
        }
        return `${chat_dir} is not a valid direction!`;
    }
    public type: ACTION_TYPE.LOOK = ACTION_TYPE.LOOK;
    public readonly cost: number = 0;
    constructor(world: World, entity: Entity, public direction: DIRECTION) {
        super(world, entity);
    }
    public perform() {
        this.entity.look(this.direction);
        return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
            'direction': DIRECTION[this.direction],
        };
    }
}
