import type { Entity } from '../entity';
import { WaitOnceEvent } from '../event/wait_once_event';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export class WaitOnceAction extends ActionBase {
    public static fromArgs(args: string[]) {
        return new WaitOnceAction();
    }
    public type: ACTION_TYPE.WAIT_ONCE = ACTION_TYPE.WAIT_ONCE;
    public readonly cost: number = 0;
    public async perform(entity: Entity) {
        entity.location.cell.emit(new WaitOnceEvent(entity), entity.location)
        return { 'result': ACTION_RESULT.INSUFFICIENT_AP, 'cost': 0 };
    }
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}
