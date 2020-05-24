import type { Entity } from '../entity';
import { EquipArmorEvent } from '../event/equip_armor_event';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export class EquipArmorAction extends ActionBase {
    public static fromArgs(args: string[]) {
        if (args.length < 1) {
            return `Provide an item id!`
        }
        return new EquipArmorAction(args[0]);
    }
    public type: ACTION_TYPE.EQUIP_ARMOR = ACTION_TYPE.EQUIP_ARMOR;
    public readonly cost: number = 15;
    constructor(public item_id: string) {
        super();
    }
    public async perform(entity: Entity) {
        if (!entity.isMob()) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        const [inventory, sheet] = entity.getComponents('inventory', 'sheet');
        const item = inventory.accessItemByID(this.item_id);
        if (item === undefined || !item.isArmor()) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        if (sheet.hasSufficientAP(this.cost)) {
            const armor = inventory.removeAndReturnItemByID(this.item_id);
            if (armor === undefined || !armor.isArmor()) {
                console.log('MAJOR BUG! THIS SHOULD NEVER OCCUR! ITEM ACCESS BY ID IS INCONSISTENT!');
                if (armor !== undefined) {
                    inventory.addItem(armor);
                }
                return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
            }
            sheet.equipment.equipArmor(armor, inventory);
            entity.location.cell.emit(new EquipArmorEvent(entity, armor), entity.location);
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
