import type { ActionClass } from '../action';
import type { Entity } from '../entity';
import type { World } from '../world';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export const SayAction: ActionClass<ACTION_TYPE.SAY> = class extends ActionBase {
    public static arg_count = -1;
    public static fromArgs(world: World, entity: Entity, args: string[]) {
        return new SayAction(world, entity, args.join(' '));
    }
    public type: ACTION_TYPE.SAY = ACTION_TYPE.SAY;
    public readonly cost: number = 0;
    constructor(world: World, entity: Entity, public message: string) {
        super(world, entity);
    }
    public perform() {
        this.entity.say(this.message);
        return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
            'message': this.message,
        };
    }
}
