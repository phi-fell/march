import { getTileProps } from '../../tile';
import { ChatDirections, DIRECTION, directionVectors } from '../direction';
import type { Entity } from '../entity';
import { MoveEvent } from '../event/move_event';
import { SetBoardEvent } from '../event/set_board_event';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export class MoveAction extends ActionBase {
    public static fromArgs(args: string[]) {
        if (args.length < 1) {
            return 'Provide a direction!';
        }
        const chat_dir = args[0];
        const dir = ChatDirections[chat_dir];
        if (dir !== undefined) {
            return new MoveAction(dir);
        }
        return `${chat_dir} is not a valid direction!`;
    }
    public type: ACTION_TYPE.MOVE = ACTION_TYPE.MOVE;
    public readonly cost: number = 5;
    constructor(public direction: DIRECTION) {
        super();
    }
    public async perform(entity: Entity) {
        const [direction, sheet] = entity.getComponents('direction', 'sheet');
        if (direction !== undefined && direction !== this.direction) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }

        const vec = directionVectors[this.direction];
        const newLoc = entity.location.translate(vec.x, vec.y);

        if (!getTileProps(newLoc.getTileAt()).passable) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        for (const ent of newLoc.getEntitiesAt()) {
            if (ent.isCollidable()) {
                return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
            }
        }

        if (sheet === undefined) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        if (sheet.hasSufficientAP(this.cost)) {
            const oldLoc = entity.location;
            entity.setPosition(newLoc.getPosition());
            entity.location.cell.emit(new MoveEvent(entity, newLoc, this.direction), oldLoc, newLoc);
            entity.getComponent('controller')?.sendEvent(new SetBoardEvent());
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
