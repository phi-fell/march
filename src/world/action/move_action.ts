import { getTileProps } from '../../tile';
import type { ActionClass } from '../action';
import { ChatDirections, DIRECTION, directionVectors } from '../direction';
import type { Entity } from '../entity';
import { MoveEvent } from '../event/move_event';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export const MoveAction: ActionClass<ACTION_TYPE.MOVE> = class extends ActionBase {
    public static arg_count = 1;
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
    public perform(entity: Entity) {
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
            entity.setLocation(newLoc);
            entity.location.cell.emit(new MoveEvent(entity, this.direction), oldLoc, newLoc);
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
