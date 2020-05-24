import type { Entity } from '../entity';
import { UnequipWeaponEvent } from '../event/unequip_weapon_event';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export class UnequipWeaponAction extends ActionBase {
    public static fromArgs(args: string[]) {
        return new UnequipWeaponAction();
    }
    public type: ACTION_TYPE.UNEQUIP_WEAPON = ACTION_TYPE.UNEQUIP_WEAPON;
    public readonly cost: number = 15;
    constructor() {
        super();
    }
    public async perform(entity: Entity) {
        if (!entity.isMob()) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        const [inventory, sheet] = entity.getComponents('inventory', 'sheet');
        const item = sheet.equipment.getWeapon();
        if (item === undefined) {
            return { 'result': ACTION_RESULT.REDUNDANT, 'cost': 0 };
        }
        if (sheet.hasSufficientAP(this.cost)) {
            sheet.equipment.unequipWeapon(inventory);
            entity.location.cell.emit(new UnequipWeaponEvent(entity, item), entity.location);
            return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
        }
        return { 'result': ACTION_RESULT.INSUFFICIENT_AP, 'cost': 0 }
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
        };
    }
}
