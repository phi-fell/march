import { AddMobEvent, AttackEvent, MoveEvent, RemoveMobEvent, TurnEvent } from '../clientevent';
import { DIRECTION, directionVectors } from './direction';
import type { Entity } from './entity';
import { Instance } from '../old_instance';
import type { EQUIPMENT_SLOT } from '../item/equipment_slot';
import type { WorldItemStack } from '../item/worlditemstack';
import type { World } from './world';

export enum ACTION_TYPE {
    ASYNC,
    WAIT,
    UNWAIT,
    MOVE,
    STRAFE,
    TURN,
    USE_PORTAL,
    ATTACK,
    PICKUP,
    DROP,
    EQUIP,
    UNEQUIP,
}

enum ACTION_RESULT {
    ASYNC, // Performing calculations, waiting for file or network I/O, etc.
    SUCCESS, // Action performed
    INSUFFICIENT_AP, // Not enough AP
    REDUNDANT, // Action would not result in any change (e.g. equipping already equipped item, turning to face the same direction)
    FAILURE, // Action is Impossible
}

export interface Action {
    type: ACTION_TYPE;
    perform(world: World, entity: Entity): { result: ACTION_RESULT, cost: number };
    toJSON(): object;
}

export class AsyncAction implements Action {
    public type: ACTION_TYPE.ASYNC = ACTION_TYPE.ASYNC;
    public readonly cost: number = 0;
    public perform(world: World, entity: Entity) { return { 'result': ACTION_RESULT.ASYNC, 'cost': 0 }; }
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}

export class WaitAction implements Action {
    public type: ACTION_TYPE.WAIT = ACTION_TYPE.WAIT;
    public readonly cost: number = 0;
    public perform(world: World, entity: Entity) { return { 'result': ACTION_RESULT.INSUFFICIENT_AP, 'cost': 0 }; }
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}
export class UnwaitAction implements Action {
    public type: ACTION_TYPE.UNWAIT = ACTION_TYPE.UNWAIT;
    public readonly cost: number = 0;
    public perform(world: World, entity: Entity) { return { 'result': ACTION_RESULT.SUCCESS, 'cost': 0 }; }
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}

export class MoveAction implements Action {
    public type: ACTION_TYPE.MOVE = ACTION_TYPE.MOVE;
    public readonly cost: number = 5;
    constructor(public direction: DIRECTION) { }
    public perform(world: World, entity: Entity) {
        if (entity.direction !== this.direction) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        const to = entity.location.translate(directionVectors[this.direction].x, directionVectors[this.direction].y);
        const inst = Instance.getLoadedInstanceById(entity.location.instance_id);
        if (!inst) {
            console.log('CANNOT MOVE() ENTITY IN NONEXISTENT LOCATION!');
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
            'type': ACTION_TYPE[this.type],
            'direction': this.direction,
        };
    }
}

export class StrafeAction implements Action {
    public type: ACTION_TYPE.STRAFE = ACTION_TYPE.STRAFE;
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
            'type': ACTION_TYPE[this.type],
            'direction': this.direction,
        };
    }
}

export class TurnAction implements Action {
    public type: ACTION_TYPE.TURN = ACTION_TYPE.TURN;
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
            'type': ACTION_TYPE[this.type],
            'direction': this.direction,
        };
    }
}

export class UsePortalAction implements Action {
    public type: ACTION_TYPE.USE_PORTAL = ACTION_TYPE.USE_PORTAL;
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
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
        };
    }
}

export class AttackAction implements Action {
    public type: ACTION_TYPE.ATTACK = ACTION_TYPE.ATTACK;
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

export class PickupAction implements Action {
    public type: ACTION_TYPE.PICKUP = ACTION_TYPE.PICKUP;
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
        let picked_up: boolean = false;
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

export class DropAction implements Action {
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

export class EquipAction implements Action {
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

export class UnequipAction implements Action {
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
