import type { Entity } from '../entity';
import { EquipWeaponEvent } from '../event/equip_weapon_event';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export class EquipWeaponAction extends ActionBase {
    public static fromArgs(args: string[]) {
        if (args.length < 1) {
            return `Provide an item id!`
        }
        return new EquipWeaponAction(args[0]);
    }
    public type: ACTION_TYPE.EQUIP_WEAPON = ACTION_TYPE.EQUIP_WEAPON;
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
        if (item === undefined || !item.isWeapon()) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        if (sheet.hasSufficientAP(this.cost)) {
            const weapon = inventory.removeAndReturnItemByID(this.item_id);
            if (weapon === undefined || !weapon.isWeapon()) {
                console.log('MAJOR BUG! THIS SHOULD NEVER OCCUR! ITEM ACCESS BY ID IS INCONSISTENT!');
                if (weapon !== undefined) {
                    inventory.addItem(weapon);
                }
                return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
            }
            sheet.equipment.equipWeapon(weapon, inventory);
            entity.location.cell.emit(new EquipWeaponEvent(entity, weapon), entity.location);
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
