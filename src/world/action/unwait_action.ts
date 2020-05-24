import type { Entity } from '../entity';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export class UnwaitAction extends ActionBase {
    public static fromArgs(args: string[]) {
        return new UnwaitAction();
    }
    public type: ACTION_TYPE.UNWAIT = ACTION_TYPE.UNWAIT;
    public readonly cost: number = 0;
    public async perform(entity: Entity) { return { 'result': ACTION_RESULT.SUCCESS, 'cost': 0 }; }
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}
