import type { Entity } from '../entity';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export class AsyncAction extends ActionBase {
    public static fromArgs(args: string[]) {
        return new AsyncAction();
    }
    public type: ACTION_TYPE.ASYNC = ACTION_TYPE.ASYNC;
    public readonly cost: number = 0;
    public async perform(entity: Entity, ) { return { 'result': ACTION_RESULT.ASYNC, 'cost': 0 }; }
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}


