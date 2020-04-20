import type { ActionClass } from '../action';
import type { Entity } from '../entity';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export const AsyncAction: ActionClass<ACTION_TYPE.ASYNC> = class extends ActionBase {
    public static arg_count = 0;
    public static fromArgs(args: string[]) {
        return new AsyncAction();
    }
    public type: ACTION_TYPE.ASYNC = ACTION_TYPE.ASYNC;
    public readonly cost: number = 0;
    public perform(entity: Entity, ) { return { 'result': ACTION_RESULT.ASYNC, 'cost': 0 }; }
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}


