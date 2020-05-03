import type { Entity, ItemEntity } from '../entity';
import { PickupEvent } from '../event/pickup_event';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export class PickupAction extends ActionBase {
    public static fromArgs(args: string[]) {
        if (args.length < 1) {
            return `Provide an item id!`
        }
        return new PickupAction(args[0]);
    }
    public type: ACTION_TYPE.PICKUP = ACTION_TYPE.PICKUP;
    public readonly cost: number = 10;
    constructor(public item_id: string) {
        super();
    }
    public perform(entity: Entity) {
        if (!entity.isMob()) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        const ents = entity.location.getEntitiesAt().filter((ent) => ent.isItem() && ent.id === this.item_id) as ItemEntity[];
        if (ents.length === 0) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        if (entity.getComponent('sheet').hasSufficientAP(this.cost)) {
            if (ents.length > 1) {
                console.log('Entities with same ID exist!')
            }
            const item = ents[0].getComponent('item_data');
            entity.location.cell.emit(new PickupEvent(entity, item), entity.location);
            entity.getComponent('inventory').addItem(item);
            ents[0].removeFromWorld();
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
