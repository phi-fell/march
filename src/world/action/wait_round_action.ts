import type { Entity } from '../entity';
import { WaitRoundEvent } from '../event/wait_round_event';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export class WaitRoundAction extends ActionBase {
    public static fromArgs(args: string[]) {
        return new WaitRoundAction();
    }
    public type: ACTION_TYPE.WAIT_ROUND = ACTION_TYPE.WAIT_ROUND;
    public readonly cost: number = 0;
    private emitted = false;
    public async perform(entity: Entity) {
        if (!this.emitted) {
            entity.location.cell.emit(new WaitRoundEvent(entity), entity.location);
            this.emitted = true;
        }
        return { 'result': ACTION_RESULT.INSUFFICIENT_AP, 'cost': 0 };
    }
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}
