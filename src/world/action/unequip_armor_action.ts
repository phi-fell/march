import { ARMOR_SLOT } from '../../item/armor_slot';
import type { Entity } from '../entity';
import { UnequipArmorEvent } from '../event/unequip_armor_event';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export class UnequipArmorAction extends ActionBase {
    public static fromArgs(args: string[]) {
        if (args.length < 1) {
            return `Provide an armor slot!`
        }
        const slot_name = args[0].toUpperCase();
        if (!Object.keys(ARMOR_SLOT).filter((k) => isNaN(Number(k))).includes(slot_name)) {
            return `Invalid armor slot: ${args[0]}!`
        }
        const slot = ARMOR_SLOT[slot_name as keyof typeof ARMOR_SLOT];
        return new UnequipArmorAction(slot);
    }
    public type: ACTION_TYPE.UNEQUIP_ARMOR = ACTION_TYPE.UNEQUIP_ARMOR;
    public readonly cost: number = 15;
    constructor(public slot: ARMOR_SLOT) {
        super();
    }
    public async perform(entity: Entity) {
        if (!entity.isMob()) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        const [inventory, sheet] = entity.getComponents('inventory', 'sheet');
        const item = sheet.equipment.getArmor(this.slot);
        if (item === undefined) {
            return { 'result': ACTION_RESULT.REDUNDANT, 'cost': 0 };
        }
        if (sheet.hasSufficientAP(this.cost)) {
            sheet.equipment.unequipArmor(this.slot, inventory);
            entity.location.cell.emit(new UnequipArmorEvent(entity, item), entity.location);
            return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
        }
        return { 'result': ACTION_RESULT.INSUFFICIENT_AP, 'cost': 0 }
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
            'slot': ARMOR_SLOT[this.slot],
        };
    }
}
