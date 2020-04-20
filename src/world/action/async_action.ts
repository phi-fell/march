import type { ActionClass } from '../action';
import type { Entity } from '../entity';
import type { World } from '../world';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export const AsyncAction: ActionClass<ACTION_TYPE.ASYNC> = class extends ActionBase {
    public static arg_count = 0;
    public static fromArgs(world: World, entity: Entity, args: string[]) {
        return new AsyncAction(world, entity);
    }
    public type: ACTION_TYPE.ASYNC = ACTION_TYPE.ASYNC;
    public readonly cost: number = 0;
    public perform() { return { 'result': ACTION_RESULT.ASYNC, 'cost': 0 }; }
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}


