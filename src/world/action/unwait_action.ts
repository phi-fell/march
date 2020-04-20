import type { ActionClass } from '../action';
import type { Entity } from '../entity';
import type { World } from '../world';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export const UnwaitAction: ActionClass<ACTION_TYPE.UNWAIT> = class extends ActionBase {
    public static arg_count = 0;
    public static fromArgs(world: World, entity: Entity, args: string[]) {
        return new UnwaitAction(world, entity);
    }
    public type: ACTION_TYPE.UNWAIT = ACTION_TYPE.UNWAIT;
    public readonly cost: number = 0;
    public perform() { return { 'result': ACTION_RESULT.SUCCESS, 'cost': 0 }; }
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}
