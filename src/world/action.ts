import type { ValueOf } from '../util/types';
import type { ACTION_RESULT } from './action/actionresult';
import { ACTION_TYPE } from './action/actiontype';
import { AsyncAction } from './action/async_action';
import { AttackAction } from './action/attack_action';
import { BackstepAction } from './action/backstep_action';
import { DropAction } from './action/drop_action';
import { EquipArmorAction } from './action/equip_armor_action';
import { EquipWeaponAction } from './action/equip_weapon_action';
import { LookAction } from './action/look_action';
import { MoveAction } from './action/move_action';
import { PickupAction } from './action/pickup_action';
import { SayAction } from './action/say_action';
import { StrafeAction } from './action/strafe_action';
import { TurnAction } from './action/turn_action';
import { UnequipArmorAction } from './action/unequip_armor_action';
import { UnequipWeaponAction } from './action/unequip_weapon_action';
import { UnwaitAction } from './action/unwait_action';
import { UsePortalAction } from './action/use_portal_action';
import { WaitAction } from './action/wait_action';
import { WaitOnceAction } from './action/wait_once_action';
import { WaitRoundAction } from './action/wait_round_action';
import type { Entity } from './entity';

export interface Action<T extends ACTION_TYPE = ACTION_TYPE> {
    type: T;
    perform(entity: Entity): Promise<{ result: ACTION_RESULT, cost: number }>;
    toJSON(): object;
}

export interface ActionClass<T extends ACTION_TYPE> {
    fromArgs(args: string[]): Action<T> | string;
    new(...args: any): Action<T>;
}

type ActionClassArray = {
    [P in ValueOf<typeof ACTION_TYPE>]: ActionClass<P>;
};

export const ChatActions: Record<string, ACTION_TYPE | undefined> = {
    'wait_forever': ACTION_TYPE.WAIT,
    'skip': ACTION_TYPE.WAIT_ONCE,
    'wait': ACTION_TYPE.WAIT_ROUND,
    'unwait': ACTION_TYPE.UNWAIT,
    'say': ACTION_TYPE.SAY,
    'look': ACTION_TYPE.LOOK,
    'move': ACTION_TYPE.MOVE,
    'strafe': ACTION_TYPE.STRAFE,
    'turn': ACTION_TYPE.TURN,
    'attack': ACTION_TYPE.ATTACK,
    'pickup': ACTION_TYPE.PICKUP,
    'drop': ACTION_TYPE.DROP,
    'wear': ACTION_TYPE.EQUIP_ARMOR,
    'unwear': ACTION_TYPE.UNEQUIP_ARMOR,
    'wield': ACTION_TYPE.EQUIP_WEAPON,
    'unweild': ACTION_TYPE.UNEQUIP_WEAPON,
    'use_portal': ACTION_TYPE.USE_PORTAL,
}
export const ActionClasses: ActionClassArray = [
    AsyncAction,
    WaitAction,
    WaitOnceAction,
    WaitRoundAction,
    UnwaitAction,
    SayAction,
    LookAction,
    MoveAction,
    StrafeAction,
    BackstepAction,
    TurnAction,
    AttackAction,
    PickupAction,
    DropAction,
    EquipArmorAction,
    UnequipArmorAction,
    EquipWeaponAction,
    UnequipWeaponAction,
    UsePortalAction,
];

/*

class EquipAction {
public readonly cost: number = 12;
constructor(public item_id: string) { }
public perform(world: World, entity: Entity) {
if (!entity.sheet) {
    console.log('Entity without sheet cannot Equip!')
    return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
}
const stack = entity.sheet.equipment.inventory.getItemStackById(this.item_id);
if (!stack) {
    console.log('Cannot equip nonexistent item!');
    return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
}
if (stack.item.asWeapon) {
    entity.sheet.equipment.equipWeapon(entity.sheet.equipment.inventory.removeItemById(this.item_id)!.asWeapon);
} else if (stack.item.asArmor) {
    entity.sheet.equipment.equipArmor(entity.sheet.equipment.inventory.removeItemById(this.item_id)!.asArmor);
} else {
    console.log('Cannot equip that item type!');
    return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
}
return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
}

}

class UnequipAction {
public readonly cost: number = 8;
constructor(public slot: EQUIPMENT_SLOT) { }
public perform(world: World, entity: Entity) {
if (!entity.sheet) {
    console.log('Entity without sheet cannot Unequip!')
    return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
}
if (entity.sheet.equipment.unequip(this.slot)) {
    return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
}
return { 'result': ACTION_RESULT.REDUNDANT, 'cost': 0 };
}
}
*/
