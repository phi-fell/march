import fs = require('fs');

import { CharacterSheet } from './character/charactersheet';
import { CharGen } from './chargen';
import { AddMobEvent, MoveEvent, RemoveMobEvent } from './clientevent';
import { DIRECTION, directionVectors } from './direction';
import { ACTION_STATUS, Entity } from './entity';
import { Instance } from './instance';
import { EQUIPMENT_SLOT } from './item/equipment_slot';
import { WorldItemStack } from './item/worlditemstack';
import { Location } from './location';
import { Random } from './math/random';
import { User } from './user';

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

const ACTION_COST = [0, 0, 5, 8, 5, 5, 10, 2, 2, 12, 8];

export interface PlayerAction {
    type: ACTION_TYPE;
    cost: number;
    toJSON(): object;
}

export class WaitAction implements PlayerAction {
    public type: ACTION_TYPE.WAIT = ACTION_TYPE.WAIT;
    public readonly cost: number = 0;
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}
export class UnwaitAction implements PlayerAction {
    public type: ACTION_TYPE.UNWAIT = ACTION_TYPE.UNWAIT;
    public readonly cost: number = 0;
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}

export class MoveAction implements PlayerAction {
    public type: ACTION_TYPE.MOVE = ACTION_TYPE.MOVE;
    public readonly cost: number = 5;
    constructor(public direction: DIRECTION) { }
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
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
        };
    }
}

export class AttackAction implements PlayerAction {
    public type: ACTION_TYPE.ATTACK = ACTION_TYPE.ATTACK;
    public readonly cost: number = 10;
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
    public static loadPlayer(id: string | null, callback: any) {
        if (id === null) {
            return process.nextTick(() => {
                callback('Cannot load player id null!', null);
            });
        }
        if (id in players) {
            return process.nextTick(() => {
                callback(null, players[id]);
            });
        }
        fs.readFile('players/' + id + '.plr', (file_err, data) => {
            if (file_err) {
                return callback(file_err);
            }
            const plrdat = JSON.parse('' + data);
            const loc: Location = Location.fromJSON(plrdat.location);
            Instance.loadInstance(loc.instance_id, (inst_err: any, _inst: any) => {
                if (inst_err) {
                    console.log(inst_err);
                    return callback(inst_err);
                }
                const ret = new Player(id, plrdat.name, loc, DIRECTION[plrdat.direction as keyof typeof DIRECTION]);
                ret.charSheet = CharacterSheet.fromJSON(plrdat.sheet);
                callback(null, ret);
            });
        });
    }
    public user: User | null;
    public active: boolean;
    protected queuedAction: PlayerAction | null;
    private visibleMobs: string[] = [];
    private constructor(id: string, name: string, loc: Location, dir: DIRECTION = DIRECTION.UP) {
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
        if (this.queuedAction) {
            if (!this.charSheet.hasSufficientAP(ACTION_COST[this.queuedAction.type])) {
                return ACTION_STATUS.WAITING; // not enough ap yet
            }
            switch (this.queuedAction.type) {
                case ACTION_TYPE.WAIT:
                    return ACTION_STATUS.WAITING;
                    break;
                case ACTION_TYPE.UNWAIT:
                    this.queuedAction = null;
                    return ACTION_STATUS.ASYNC;
                    break;
                case ACTION_TYPE.MOVE: {
                    if (this.direction !== (this.queuedAction as MoveAction).direction) {
                        if (!this.charSheet.hasSufficientAP(ACTION_COST[ACTION_TYPE.TURN] + ACTION_COST[this.queuedAction.type])) {
                            return ACTION_STATUS.WAITING; // not enough ap yet
                        }
                        this.direction = (this.queuedAction as MoveAction).direction;
                        this.charSheet.useAP(ACTION_COST[this.queuedAction.type]);
                    }
                    const success = this.move((this.queuedAction as MoveAction).direction);
                    if (success) {
                        this.charSheet.useAP(ACTION_COST[this.queuedAction.type]);
                    }
                    this.queuedAction = null;
                    break;
                } case ACTION_TYPE.STRAFE: {
                    const success = this.move((this.queuedAction as StrafeAction).direction);
                    if (success) {
                        if (this.direction === (this.queuedAction as StrafeAction).direction) {
                            this.charSheet.useAP(ACTION_COST[ACTION_TYPE.MOVE]);
                        } else {
                            this.charSheet.useAP(ACTION_COST[this.queuedAction.type]);
                        }
                    }
                    this.queuedAction = null;
                    break;
                } case ACTION_TYPE.TURN: {
                    if (this.direction !== (this.queuedAction as TurnAction).direction) {
                        this.direction = (this.queuedAction as TurnAction).direction;
                        this.charSheet.useAP(ACTION_COST[this.queuedAction.type]);
                    }
                    this.queuedAction = null;
                    break;
                } case ACTION_TYPE.USE_PORTAL: {
                    const inst = Instance.getLoadedInstanceById(this.location.instance_id)!;
                    for (const portal of inst.portals) {
                        if (portal.location.equals(this._location)) {
                            this.charSheet.useAP(ACTION_COST[this.queuedAction.type]);
                            this.queuedAction = null;
                            const plr = this;
                            portal.reify((err, dest) => {
                                if (err || !dest) {
                                    return console.log('Error: ' + err);
                                }
                                plr.location = dest;
                            });
                            break;
                        }
                    }
                    this.queuedAction = null;
                    break;
                } case ACTION_TYPE.ATTACK: {
                    const inst = Instance.getLoadedInstanceById(this.location.instance_id)!;
                    const vec = directionVectors[this.direction];
                    const attackPos = this.location.getMovedBy(vec.x, vec.y);
                    const opponent = inst.getMobInLocation(attackPos.x, attackPos.y);
                    this.charSheet.useAP(ACTION_COST[this.queuedAction.type]);
                    if (opponent) {
                        opponent.hit(this);
                    }
                    this.queuedAction = null;
                    break;
                } case ACTION_TYPE.PICKUP: {
                    const inst = Instance.getLoadedInstanceById(this.location.instance_id)!;
                    const pickup = this.queuedAction as PickupAction;
                    const inv = this.charSheet.equipment.inventory;
                    const loc = this.location;
                    let picked_up: boolean = false;
                    inst.items.forEach((stack: WorldItemStack, index: number) => {
                        if (stack.location.equals(loc) && stack.item.id === pickup.item_id) {
                            this.charSheet.useAP(ACTION_COST[pickup.type]);
                            if (pickup.count === null || stack.count === null || pickup.count >= stack.count) {
                                inv.addItem(stack.item, stack.count);
                                inst.items.splice(index, 1);
                            } else {
                                inv.addItem(stack.item.clone(), pickup.count);
                                stack.count -= pickup.count;
                            }
                            picked_up = true;
                            return;
                        }
                    });
                    if (!picked_up) {
                        console.log('Cannot pick up nonexistent item!');
                        break;
                    }
                    this.queuedAction = null;
                    break;
                } case ACTION_TYPE.DROP: {
                    const inst = Instance.getLoadedInstanceById(this.location.instance_id)!;
                    const drop = this.queuedAction as DropAction;
                    const inv = this.charSheet.equipment.inventory;
                    let dropped: boolean = false;
                    for (let i = 0; i < inv.stacks; i++) {
                        const stack = inv.getItemStack(i);
                        if (drop.item_id === stack.item.id) {
                            if (drop.count === null || stack.count === null || drop.count >= stack.count) {
                                inst.dropItem(stack.item, stack.count, this.location);
                                inv.removeItemFromSlot(i);
                            } else {
                                const dropItem = stack.item.clone();
                                stack.count -= drop.count;
                                inst.dropItem(dropItem, drop.count, this.location);
                            }
                            dropped = true;
                            this.charSheet.useAP(ACTION_COST[this.queuedAction.type]);
                            break;
                        }
                    }
                    if (!dropped) {
                        console.log('Cannot drop nonexistent item!');
                        break;
                    }
                    this.queuedAction = null;
                    break;
                } case ACTION_TYPE.EQUIP: {
                    const equip = this.queuedAction as EquipAction;
                    const stack = this.charSheet.equipment.inventory.getItemStackById(equip.item_id);
                    if (!stack) {
                        console.log('Cannot equip nonexistent item!');
                        break;
                    }
                    const item = stack.item;
                    if (item.asWeapon) {
                        this.charSheet.equipment.equipWeapon(this.charSheet.equipment.inventory.removeItemById(equip.item_id)!.asWeapon);
                    } else if (item.asArmor) {
                        this.charSheet.equipment.equipArmor(this.charSheet.equipment.inventory.removeItemById(equip.item_id)!.asArmor);
                    } else {
                        console.log('Cannot equip that item type!');
                    }
                    this.queuedAction = null;
                    break;
                } case ACTION_TYPE.UNEQUIP: {
                    const unequip = this.queuedAction as UnequipAction;
                    this.charSheet.equipment.unequip(unequip.slot);
                    this.queuedAction = null;
                    break;
                }
            }
            return ACTION_STATUS.PERFORMED;
        }
        return ACTION_STATUS.ASYNC; // needs to decide
    }
    public setActive(usr: User) {
        if (this.active) {
            // TODO: error?
        }
        this.active = true;
        this.user = usr;
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
        const data = {
            'name': this.name,
            'location': this.location.toJSON(),
            'direction': DIRECTION[this.direction],
            'sheet': this.charSheet.toJSON(),
        };
        fs.writeFile('players/' + this.id + '.plr', JSON.stringify(data), (err) => {
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
    protected move(dir: DIRECTION) {
        const to = this.location.getMovedBy(directionVectors[dir].x, directionVectors[dir].y);
        const inst = Instance.getLoadedInstanceById(this.location.instance_id);
        if (!inst) {
            return console.log('CANNOT MOVE() PLAYER IN NONEXISTENT LOCATION!');
        }
        if (!inst.isTilePassable(to.x, to.y)) {
            return false;
        }
        if (inst.getMobInLocation(to.x, to.y)) {
            return false;
        }
        inst.emitWB(new AddMobEvent(this, this.location), [to], [this.location]);
        inst.emit(new MoveEvent(this, dir), this.location, to);
        inst.emitWB(new RemoveMobEvent(this, this.location), [this.location], [to]);
        this.location = to;
        return true;
    }
    protected handleDeath() {
        Instance.removeEntityFromWorld(this);
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
