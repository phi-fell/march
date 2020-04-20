import type { ActionClass } from '../action';
import type { Entity } from '../entity';
import type { World } from '../world';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export const WaitAction: ActionClass<ACTION_TYPE.WAIT> = class extends ActionBase {
    public static arg_count = 0;
    public static fromArgs(world: World, entity: Entity, args: string[]) {
        return new WaitAction(world, entity);
    }
    public type: ACTION_TYPE.WAIT = ACTION_TYPE.WAIT;
    public readonly cost: number = 0;
    public perform() { return { 'result': ACTION_RESULT.INSUFFICIENT_AP, 'cost': 0 }; }
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}
