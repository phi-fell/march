import type { ActionClass } from '../action';
import type { Entity } from '../entity';
import { SayEvent } from '../event/say_event';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export const SayAction: ActionClass<ACTION_TYPE.SAY> = class extends ActionBase {
    public static arg_count = -1;
    public static fromArgs(args: string[]) {
        return new SayAction(args.join(' '));
    }
    public type: ACTION_TYPE.SAY = ACTION_TYPE.SAY;
    public readonly cost: number = 0;
    constructor(public message: string) {
        super();
    }
    public perform(entity: Entity) {
        entity.location.cell.emit(new SayEvent(entity, this.message), entity.location);
        return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
            'message': this.message,
        };
    }
}
