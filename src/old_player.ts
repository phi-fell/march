import fs = require('fs');

import { CharacterSheet } from './character/charactersheet';
import { AddMobEvent, AttackEvent, MoveEvent, RemoveMobEvent, TurnEvent } from './clientevent';
import { CharGen } from './deprecated/chargen';
import type { EQUIPMENT_SLOT } from './item/equipment_slot';
import type { WorldItemStack } from './item/worlditemstack';
import { Random } from './math/random';
import { ACTION_STATUS, Entity, MAX_VISIBILITY_RADIUS } from './old_entity';
import { Instance } from './old_instance';
import { Location } from './old_location';
import type { User } from './user';
import { DIRECTION, directionVectors } from './world/direction';

const players: { [id: string]: Player; } = {};

export enum ACTION_TYPE {
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
    SUCCESS,
    INSUFFICIENT_AP,
    REDUNDANT,
    FAILURE,
}

export interface PlayerAction {
    type: ACTION_TYPE;
    perform(player: Player): { result: ACTION_RESULT, cost: number };
    toJSON(): object;
}

export class WaitAction implements PlayerAction {
    public type: ACTION_TYPE.WAIT = ACTION_TYPE.WAIT;
    public readonly cost: number = 0;
    public perform(player: Player) { return { 'result': ACTION_RESULT.INSUFFICIENT_AP, 'cost': 0 }; }
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}
export class UnwaitAction implements PlayerAction {
    public type: ACTION_TYPE.UNWAIT = ACTION_TYPE.UNWAIT;
    public readonly cost: number = 0;
    public perform(player: Player) { return { 'result': ACTION_RESULT.SUCCESS, 'cost': 0 }; }
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}

export class MoveAction implements PlayerAction {
    public type: ACTION_TYPE.MOVE = ACTION_TYPE.MOVE;
    public readonly cost: number = 5;
    constructor(public direction: DIRECTION) { }
    public perform(player: Player) {
        if (player.direction !== this.direction) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        const to = player.location.getMovedBy(directionVectors[this.direction].x, directionVectors[this.direction].y);
        const inst = Instance.getLoadedInstanceById(player.location.instance_id);
        if (!inst) {
            console.log('CANNOT MOVE() PLAYER IN NONEXISTENT LOCATION!');
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        if (!inst.isTilePassable(to.x, to.y)) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        if (inst.getMobInLocation(to.x, to.y)) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        if (player.charSheet.hasSufficientAP(this.cost)) {
            inst.emitWB(new AddMobEvent(player), [to], [player.location]);
            inst.emit(new MoveEvent(player, this.direction), player.location, to);
            inst.emitWB(new RemoveMobEvent(player), [player.location], [to]);
            player.location = to;
            return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
        }
        return { 'result': ACTION_RESULT.INSUFFICIENT_AP, 'cost': 0 };
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
            'direction': this.direction,
        };
    }
}

export class StrafeAction implements PlayerAction {
    public type: ACTION_TYPE.STRAFE = ACTION_TYPE.STRAFE;
    public readonly cost: number = 8;
    constructor(public direction: DIRECTION) { }
    public perform(player: Player) {
        const to = player.location.getMovedBy(directionVectors[this.direction].x, directionVectors[this.direction].y);
        const inst = Instance.getLoadedInstanceById(player.location.instance_id);
        if (!inst) {
            console.log('CANNOT STRAFE() PLAYER IN NONEXISTENT LOCATION!');
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        if (!inst.isTilePassable(to.x, to.y)) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        if (inst.getMobInLocation(to.x, to.y)) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        if (player.charSheet.hasSufficientAP(this.cost)) {
            inst.emitWB(new AddMobEvent(player), [to], [player.location]);
            inst.emit(new MoveEvent(player, this.direction), player.location, to);
            inst.emitWB(new RemoveMobEvent(player), [player.location], [to]);
            player.location = to;
            return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
        }
        return { 'result': ACTION_RESULT.INSUFFICIENT_AP, 'cost': 0 };
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
            'direction': this.direction,
        };
    }
}

export class TurnAction implements PlayerAction {
    public type: ACTION_TYPE.TURN = ACTION_TYPE.TURN;
    public readonly cost: number = 5;
    constructor(public direction: DIRECTION) { }
    public perform(player: Player) {
        if (player.direction === this.direction) {
            return { 'result': ACTION_RESULT.REDUNDANT, 'cost': 0 };
        }
        const inst = Instance.getLoadedInstanceById(player.location.instance_id);
        if (inst) {
            inst.emit(new TurnEvent(player, this.direction), player.location);
        }
        player.direction = this.direction;
        return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
            'direction': this.direction,
        };
    }
}

export class UsePortalAction implements PlayerAction {
    public type: ACTION_TYPE.USE_PORTAL = ACTION_TYPE.USE_PORTAL;
    public readonly cost: number = 5;
    public perform(player: Player) {
        const inst = Instance.getLoadedInstanceById(player.location.instance_id)!;
        for (const portal of inst.portals) {
            if (portal.location.equals(player.location)) {
                portal.reify((err, dest) => {
                    if (err || !dest) {
                        return console.log('Error: ' + err);
                    }
                    player.location = dest;
                });
                return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
            }
        }
        return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
        };
    }
}

export class AttackAction implements PlayerAction {
    public type: ACTION_TYPE.ATTACK = ACTION_TYPE.ATTACK;
    public readonly cost: number = 10;
    public perform(player: Player) {
        const inst = Instance.getLoadedInstanceById(player.location.instance_id)!;
        const vec = directionVectors[player.direction];
        const attackPos = player.location.getMovedBy(vec.x, vec.y);
        const opponent = inst.getMobInLocation(attackPos.x, attackPos.y);
        if (opponent) {
            opponent.hit(player);
        } else {
            inst.emit(new AttackEvent(false, player, null), player.location);
        }
        return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
        };
    }
}

export class PickupAction implements PlayerAction {
    public type: ACTION_TYPE.PICKUP = ACTION_TYPE.PICKUP;
    public readonly cost: number = 2;
    constructor(public item_id: string, public count: number) { }
    public perform(player: Player) {
        const inst = Instance.getLoadedInstanceById(player.location.instance_id)!;
        const pickup = this;
        const inv = player.charSheet.equipment.inventory;
        const loc = player.location;
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

export class DropAction implements PlayerAction {
    public type: ACTION_TYPE.DROP = ACTION_TYPE.DROP;
    public readonly cost: number = 2;
    constructor(public item_id: string, public count: number) { }
    public perform(player: Player) {
        const inst = Instance.getLoadedInstanceById(player.location.instance_id)!;
        const inv = player.charSheet.equipment.inventory;
        for (let i = 0; i < inv.stacks; i++) {
            const stack = inv.getItemStack(i);
            if (this.item_id === stack.item.id) {
                if (this.count === null || stack.count === null || this.count >= stack.count) {
                    inst.dropItem(stack.item, stack.count, player.location);
                    inv.removeItemFromSlot(i);
                } else {
                    const dropItem = stack.item.clone();
                    stack.count -= this.count;
                    inst.dropItem(dropItem, this.count, player.location);
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

export class EquipAction implements PlayerAction {
    public type: ACTION_TYPE.EQUIP = ACTION_TYPE.EQUIP;
    public readonly cost: number = 12;
    constructor(public item_id: string) { }
    public perform(player: Player) {
        const stack = player.charSheet.equipment.inventory.getItemStackById(this.item_id);
        if (!stack) {
            console.log('Cannot equip nonexistent item!');
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        if (stack.item.asWeapon) {
            player.charSheet.equipment.equipWeapon(player.charSheet.equipment.inventory.removeItemById(this.item_id)!.asWeapon);
        } else if (stack.item.asArmor) {
            player.charSheet.equipment.equipArmor(player.charSheet.equipment.inventory.removeItemById(this.item_id)!.asArmor);
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

export class UnequipAction implements PlayerAction {
    public type: ACTION_TYPE.UNEQUIP = ACTION_TYPE.UNEQUIP;
    public readonly cost: number = 8;
    constructor(public slot: EQUIPMENT_SLOT) { }
    public perform(player: Player) {
        if (player.charSheet.equipment.unequip(this.slot)) {
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

export class Player extends Entity {
    public static generateNewPlayerID() {
        return Random.uuid();
    }
    public static accessPlayer(id: string) {
        return players[id];
    }
    public static createPlayer(name: string, sheet: CharacterSheet): Player {
        const plr = new Player(Player.generateNewPlayerID(), name, CharGen.getTutorialLocation());
        plr.charSheet = sheet;
        plr.saveToDisk();
        return plr;
    }
    public static async loadPlayer(id: string): Promise<Player | undefined> {
        if (id in players) {
            return players[id];
        }
        try {
            const data = await fs.promises.readFile('players/' + id + '.plr');
            const plrdat = JSON.parse('' + data);
            const loc: Location = Location.fromJSON(plrdat.location);
            await Instance.loadInstance(loc.instance_id);
            const ret = new Player(id, plrdat.name, loc, DIRECTION[plrdat.direction as keyof typeof DIRECTION]);
            ret.charSheet = CharacterSheet.fromJSON(plrdat.sheet);
            return ret;
        } catch (err) {
            console.log(err);
        }
    }
    public user: User | null;
    public active: boolean;
    protected queuedAction: PlayerAction | null;
    private visibleMobs: Entity[] = [];
    private constructor(id: string, name: string, loc: Location, dir: DIRECTION = DIRECTION.NORTH) {
        super(id, name, 'player', loc, dir);
        this.user = null;
        this.queuedAction = null;
        this.active = false;
        const inst = Instance.getLoadedInstanceById(loc.instance_id);
        if (inst) {
            inst.addPlayer(this);
        } else {
            console.log('PLAYER CONSTRUCTED IN INVALID LOCATION STATE! INSTANCE DOES NOT EXIST: ' + loc.instance_id);
        }
        players[id] = this;
    }
    get location(): Location { // Since we override set, we must override get
        return this._location;
    }
    set location(loc: Location) {
        if (this._location.instance_id !== loc.instance_id) {
            const fromInst = Instance.getLoadedInstanceById(this._location.instance_id);
            const toInst = Instance.getLoadedInstanceById(loc.instance_id);
            if (fromInst) {
                fromInst.removePlayer(this);
            } else {
                console.log('Player moving from nonexistant instance: ' + this._location.instance_id);
            }
            if (toInst) {
                toInst.addPlayer(this);
            } else {
                console.log('PLAYER IN INVALID LOCATION STATE! INSTANCE DOES NOT EXIST: ' + loc.instance_id);
            }
        }
        this._location = loc;
        const inst = Instance.getLoadedInstanceById(loc.instance_id);
        if (inst) {
            this.visibility = inst.getTileVisibility(this, MAX_VISIBILITY_RADIUS);
        }
        this.recalculateVisibleMobs();
    }
    public setAction(action: PlayerAction) {
        this.queuedAction = action;
        if (Instance.getLoadedInstanceById(this.location.instance_id)) {
            Instance.getLoadedInstanceById(this.location.instance_id)!.notifyOfPlayerAction(this.id);
        }
        this.pushUpdate();
    }
    public removeAction() {
        this.queuedAction = null;
    }
    public doNextAction(): ACTION_STATUS {
        if (this.charSheet.status.action_points <= 0) {
            return ACTION_STATUS.WAITING; // can't do anything else
        }
        if (!this.queuedAction) {
            return ACTION_STATUS.ASYNC; // needs to decide
        }
        const { result, cost } = this.queuedAction.perform(this);
        switch (result) {
            case ACTION_RESULT.SUCCESS:
                this.charSheet.useAP(cost);
                this.queuedAction = null;
                return ACTION_STATUS.PERFORMED;
                break;
            case ACTION_RESULT.INSUFFICIENT_AP:
                return ACTION_STATUS.WAITING;
                break;
            case ACTION_RESULT.REDUNDANT:
                this.queuedAction = null;
                return ACTION_STATUS.ASYNC;
                break;
            case ACTION_RESULT.FAILURE:
                this.queuedAction = null;
                return ACTION_STATUS.ASYNC;
                break;
            default:
                console.log('INVALID ACTION RESULT!');
                return ACTION_STATUS.PERFORMED;
                break;
        }
    }
    public setActive(usr: User) {
        if (this.active) {
            // TODO: error?
        }
        this.active = true;
        this.user = usr;
        this.recalculateVisibleMobs();
        this.pushUpdate();
    }
    public setInactive() {
        if (!this.active) {
            // TODO: error?
        }
        this.active = false;
        this.user = null;
        this.unload();
    }
    public unload() {
        this.saveToDisk();
        const inst = Instance.getLoadedInstanceById(this.location.instance_id);
        if (inst) {
            Instance.removeEntityFromWorld(this);
            inst.removePlayer(this);
        }
        delete players[this.id];
    }
    public saveToDisk() {
        fs.writeFile('players/' + this.id + '.plr', JSON.stringify(this.toJSON()), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
    public pushUpdate() {
        if (this.active) {
            const board = Instance.getPlayerBoard(this);
            this.user!.socket.emit('update', {
                ...board,
                'player': this.getDataAsViewer(),
                'player_id': this.id,
            });
        } else {
            console.log('Can\'t push update to inactive player');
        }
    }
    public getDataAsViewer(viewer?: Player) {
        if (viewer) {
            // TODO: limit data based on line of sight, some attribute (intuition?) or skill (knowledge skills? perception?)
        }
        return {
            'name': this.name,
            'sheet': this.charSheet.toJSON(),
            'location': this.location.toJSON(),
            'action': (this.queuedAction) ? this.queuedAction.toJSON() : { 'type': 'NONE' },
        };
    }
    public toJSON() {
        return {
            'name': this.name,
            'sheet': this.charSheet.toJSON(),
            'location': this.location.toJSON(),
            'direction': DIRECTION[this.direction],
            'action': (this.queuedAction) ? this.queuedAction.toJSON() : { 'type': 'NONE' },
        };
    }
    protected recalculateVisibleMobs() {
        const vis = [];
        const inst = Instance.getLoadedInstanceById(this.location.instance_id);
        if (inst) {
            for (const mob of inst.mobs) {
                if (this.canSeeLoc(mob.location)) {
                    vis.push(mob);
                }
            }
        }
        for (const mob of this.visibleMobs) {
            if (vis.find((e) => e.id === mob.id)) {
                // no need to remove
            } else {
                this.user!.sendEvent(new RemoveMobEvent(mob));
            }
        }
        for (const mob of vis) {
            if (this.visibleMobs.find((e) => e.id === mob.id)) {
                // no need to add
            } else {
                this.user!.sendEvent(new AddMobEvent(mob));
            }
        }
    }
    protected handleDeath() {
        super.handleDeath();
        if (this.user) {
            this.user.player = null;
            this.user.playerid = null;
            this.user.socket.emit('force_disconnect', 'YOU HAVE DIED');
            this.user.logout();
            this.unload();
            // TODO: remove this player from disk?
        }
    }
}
