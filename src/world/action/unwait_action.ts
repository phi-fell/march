import type { ActionClass } from '../action';
import type { Entity } from '../entity';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export const UnwaitAction: ActionClass<ACTION_TYPE.UNWAIT> = class extends ActionBase {
    public static arg_count = 0;
    public static fromArgs(args: string[]) {
        return new UnwaitAction();
    }
    public type: ACTION_TYPE.UNWAIT = ACTION_TYPE.UNWAIT;
    public readonly cost: number = 0;
    public perform(entity: Entity) { return { 'result': ACTION_RESULT.SUCCESS, 'cost': 0 }; }
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}
