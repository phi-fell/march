import type { Entity } from '../entity';
import { WaitEvent } from '../event/wait_event';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export class WaitAction extends ActionBase {
    public static arg_count = 0;
    public static fromArgs(args: string[]) {
        return new WaitAction();
    }
    public type: ACTION_TYPE.WAIT = ACTION_TYPE.WAIT;
    public readonly cost: number = 0;
    private emitted = false;
    public perform(entity: Entity) {
        if (!this.emitted) {
            entity.location.cell.emit(new WaitEvent(entity), entity.location);
            this.emitted = true;
        }
        return { 'result': ACTION_RESULT.INSUFFICIENT_AP, 'cost': 0 };
    }
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}
