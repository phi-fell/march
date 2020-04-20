import type { ActionClass } from '../action';
import type { Entity } from '../entity';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export const WaitOnceAction: ActionClass<ACTION_TYPE.WAIT_ONCE> = class extends ActionBase {
    public static arg_count = 0;
    public static fromArgs(args: string[]) {
        return new WaitOnceAction();
    }
    public type: ACTION_TYPE.WAIT_ONCE = ACTION_TYPE.WAIT_ONCE;
    public readonly cost: number = 0;
    public perform(entity: Entity) { return { 'result': ACTION_RESULT.INSUFFICIENT_AP, 'cost': 0 }; }
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}
