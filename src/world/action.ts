import type { EQUIPMENT_SLOT } from '../item/equipment_slot';
import { Instance } from '../old_instance';
import { ACTION_RESULT } from './action/actionresult';
import { ACTION_TYPE } from './action/actiontype';
import { AsyncAction } from './action/async_action';
import { LookAction } from './action/look_action';
import { MoveAction } from './action/move_action';
import { SayAction } from './action/say_action';
import { UnwaitAction } from './action/unwait_action';
import { WaitAction } from './action/wait_action';
import { DIRECTION, directionVectors } from './direction';
import type { Entity } from './entity';
import type { World } from './world';


type ValueOf<T> = T[keyof T];

export interface Action<T extends ACTION_TYPE = ACTION_TYPE> {
    type: T;
    perform(): { result: ACTION_RESULT, cost: number };
    toJSON(): object;
}

export interface ActionClass<T extends ACTION_TYPE> {
    arg_count: number;
    fromArgs(world: World, Entity: Entity, args: string[]): Action<T> | string;
    new(world: World, entity: Entity, ...args: any): Action<T>;
}

type ActionClassArray = {
    [P in ValueOf<typeof ACTION_TYPE>]: ActionClass<P>;
};

export const ChatActions: Record<string, ACTION_TYPE | undefined> = {
    'wait': ACTION_TYPE.WAIT,
    'unwait': ACTION_TYPE.UNWAIT,
    'say': ACTION_TYPE.SAY,
    'look': ACTION_TYPE.LOOK,
    'move': ACTION_TYPE.MOVE,
}
export const ActionClasses: ActionClassArray = [
    AsyncAction,
    WaitAction,
    UnwaitAction,
    SayAction,
    LookAction,
    MoveAction,
];

class StrafeAction {
    public readonly cost: number = 8;
    constructor(public direction: DIRECTION) { }
    public perform(world: World, entity: Entity) {
        const to = entity.location.translate(directionVectors[this.direction].x, directionVectors[this.direction].y);
        const inst = Instance.getLoadedInstanceById(entity.location.instance_id);
        if (!inst) {
            console.log('CANNOT STRAFE() ENTITY IN NONEXISTENT LOCATION!');
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        if (!inst.isTilePassable(to.x, to.y)) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        if (inst.getMobInLocation(to.x, to.y)) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        /* TODO:
        if (entity.sheet.hasSufficientAP(this.cost)) {
            inst.emitWB(new AddMobEvent(entity), [to], [entity.location]);
            inst.emit(new MoveEvent(entity, this.direction), entity.location, to);
            inst.emitWB(new RemoveMobEvent(entity), [entity.location], [to]);
            entity.location = to;
            return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
        }
        */
        return { 'result': ACTION_RESULT.INSUFFICIENT_AP, 'cost': 0 };
    }
    public toJSON(): object {
        return {
            // 'type': ACTION_TYPE[this.type],
            'direction': this.direction,
        };
    }
}

class TurnAction {
    public readonly cost: number = 5;
    constructor(public direction: DIRECTION) { }
    public perform(world: World, entity: Entity) {
        if (entity.direction === this.direction) {
            return { 'result': ACTION_RESULT.REDUNDANT, 'cost': 0 };
        }
        const inst = Instance.getLoadedInstanceById(entity.location.instance_id);
        if (inst) {
            // TODO: inst.emit(new TurnEvent(entity, this.direction), entity.location);
        }
        entity.direction = this.direction;
        return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
    }
    public toJSON(): object {
        return {
            // 'type': ACTION_TYPE[this.type],
            'direction': this.direction,
        };
    }
}

class UsePortalAction {
    public readonly cost: number = 5;
    public perform(world: World, entity: Entity) {
        const inst = Instance.getLoadedInstanceById(entity.location.instance_id)!;
        for (const portal of inst.portals) {
            /* TODO:
            if (portal.location.equals(entity.location)) {
                portal.reify((err, dest) => {
                    if (err || !dest) {
                        return console.log('Error: ' + err);
                    }
                    // TODO: entity.location = dest;
                });
                return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
            }
            */
        }
        return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
    }
}

class AttackAction {
    public readonly cost: number = 10;
    public perform(world: World, entity: Entity) {
        const inst = Instance.getLoadedInstanceById(entity.location.instance_id)!;
        const vec = directionVectors[entity.direction];
        const attackPos = entity.location.translate(vec.x, vec.y);
        const opponent = inst.getMobInLocation(attackPos.x, attackPos.y);
        if (opponent) {
            // TODO: opponent.hit(entity);
        } else {
            // TODO: inst.emit(new AttackEvent(false, entity, null), entity.location);
        }
        return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
        };
    }
}

class PickupAction {
    public readonly cost: number = 2;
    constructor(public item_id: string, public count: number) { }
    public perform(world: World, entity: Entity) {
        if (!entity.sheet) {
            console.log('Entity without sheet cannot Pickup!')
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        const inst = Instance.getLoadedInstanceById(entity.location.instance_id)!;
        const pickup = this;
        const inv = entity.sheet.equipment.inventory;
        const loc = entity.location;
        const picked_up: boolean = false;
        /* TODO:
        inst.items.forEach((stack: WorldItemStack, index: number) => {
            if (!picked_up && stack.location.equals(loc) && stack.item.id === pickup.item_id) {
                if (pickup.count === null || stack.count === null || pickup.count >= stack.count) {
                    inv.addItem(stack.item, stack.count);
                    inst.items.splice(index, 1);
                } else {
                    inv.addItem(stack.item.clone(), pickup.count);
                    stack.count -= pickup.count;
                }
                picked_up = true;
            }
        });
        */
        if (!picked_up) {
            console.log('Cannot pick up nonexistent item!');
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
        };
    }
}

class DropAction {
    public type: ACTION_TYPE.DROP = ACTION_TYPE.DROP;
    public readonly cost: number = 2;
    constructor(public item_id: string, public count: number) { }
    public perform(world: World, entity: Entity) {
        if (!entity.sheet) {
            console.log('Entity without sheet cannot Drop!')
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        const inst = Instance.getLoadedInstanceById(entity.location.instance_id)!;
        const inv = entity.sheet.equipment.inventory;
        for (let i = 0; i < inv.stacks; i++) {
            const stack = inv.getItemStack(i);
            if (this.item_id === stack.item.id) {
                if (this.count === null || stack.count === null || this.count >= stack.count) {
                    // TODO: inst.dropItem(stack.item, stack.count, entity.location);
                    inv.removeItemFromSlot(i);
                } else {
                    const dropItem = stack.item.clone();
                    stack.count -= this.count;
                    // TODO: inst.dropItem(dropItem, this.count, entity.location);
                }
                return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
            }
        }
        console.log('Cannot drop nonexistent item!');
        return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
        };
    }
}

class EquipAction {
    public type: ACTION_TYPE.EQUIP = ACTION_TYPE.EQUIP;
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
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
        };
    }
}

class UnequipAction {
    public type: ACTION_TYPE.UNEQUIP = ACTION_TYPE.UNEQUIP;
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
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
        };
    }
}
