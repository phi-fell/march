import { Entity } from '../entity';
import { DropEvent } from '../event/drop_event';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export class DropAction extends ActionBase {
    public static fromArgs(args: string[]) {
        if (args.length < 1) {
            return `Provide an item id!`
        }
        return new DropAction(args[0]);
    }
    public type: ACTION_TYPE.DROP = ACTION_TYPE.DROP;
    public readonly cost: number = 10;
    constructor(public item_id: string) {
        super();
    }
    public perform(entity: Entity) {
        if (!entity.isMob()) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        const [inventory, sheet] = entity.getComponents('inventory', 'sheet');
        if (!inventory.hasItemByID(this.item_id)) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        if (sheet.hasSufficientAP(this.cost)) {
            const item = inventory.removeAndReturnItemByID(this.item_id);
            if (item === undefined) {
                return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
            }
            Entity.createItemEntity(item, entity.location);
            entity.location.cell.emit(new DropEvent(entity, item), entity.location);
            return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
        }
        return { 'result': ACTION_RESULT.INSUFFICIENT_AP, 'cost': 0 }
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
            'item_id': this.item_id,
        };
    }
}
