import { ChatDirections, DIRECTION } from '../direction';
import type { Entity } from '../entity';
import { TurnEvent } from '../event/turn_event';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export class TurnAction extends ActionBase {
    public static fromArgs(args: string[]) {
        if (args.length < 1) {
            return 'Provide a direction!';
        }
        const chat_dir = args[0];
        const dir = ChatDirections[chat_dir];
        if (dir !== undefined) {
            return new TurnAction(dir);
        }
        return `${chat_dir} is not a valid direction!`;
    }
    public type: ACTION_TYPE.TURN = ACTION_TYPE.TURN;
    public readonly cost: number = 5;
    constructor(public direction: DIRECTION) {
        super();
    }
    public perform(entity: Entity) {
        const [direction, sheet] = entity.getComponents('direction', 'sheet');
        if (direction === undefined) {
            return { 'result': ACTION_RESULT.REDUNDANT, 'cost': 0 };
        }
        if (direction === this.direction) {
            return { 'result': ACTION_RESULT.REDUNDANT, 'cost': 0 };
        }
        if (sheet === undefined) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        if (sheet.hasSufficientAP(this.cost)) {
            const event = new TurnEvent(entity, direction, this.direction);
            entity.setComponent('direction', this.direction);
            entity.location.cell.emit(event, entity.location);
            return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
        }
        return { 'result': ACTION_RESULT.INSUFFICIENT_AP, 'cost': 0 };
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
            'direction': DIRECTION[this.direction],
        };
    }
}
