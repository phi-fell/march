import fs = require('fs');

import { CharacterSheet } from './character/charactersheet';
import { CharGen, CharGenStage } from './chargen';
import { DIRECTION, directionVectors } from './direction';
import { ACTION_STATUS, Entity } from './entity';
import { Instance } from './instance';
import { Location } from './location';
import { Random } from './math/random';
import { generateName } from './namegen';
import { User } from './user';

const players = {};

export enum ACTION_TYPE {
    WAIT,
    UNWAIT,
    MOVE,
    STRAFE,
    TURN,
    USE_PORTAL,
    ATTACK,
}

const ACTION_COST = [0, 0, 5, 8, 5, 5, 10];

export interface PlayerAction {
    type: ACTION_TYPE;
    toJSON(): object;
}

export class WaitAction implements PlayerAction {
    public type: ACTION_TYPE.WAIT = ACTION_TYPE.WAIT;
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}
export class UnwaitAction implements PlayerAction {
    public type: ACTION_TYPE.UNWAIT = ACTION_TYPE.UNWAIT;
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}

export class MoveAction implements PlayerAction {
    public type: ACTION_TYPE.MOVE = ACTION_TYPE.MOVE;
    public directionVec: { 'x': number, 'y': number };
    constructor(public direction: DIRECTION) {
        this.directionVec = { 'x': 0, 'y': 0 };
        const dirVec = directionVectors[direction];
        this.directionVec.x = dirVec.x;
        this.directionVec.y = dirVec.y;
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
    public directionVec: { 'x': number, 'y': number };
    constructor(public direction: DIRECTION) {
        this.directionVec = { 'x': 0, 'y': 0 };
        const dirVec = directionVectors[direction];
        this.directionVec.x = dirVec.x;
        this.directionVec.y = dirVec.y;
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
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
        };
    }
}
export class AttackAction implements PlayerAction {
    public type: ACTION_TYPE.ATTACK = ACTION_TYPE.ATTACK;
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
    public static accessPlayer(id) {
        return players[id];
    }
    public static createPlayer() {
        const name = generateName();
        const plr = new Player(Player.generateNewPlayerID(), name);
        players[plr.id] = plr;
        CharGen.spawnPlayerInFreshInstance(plr);
        plr.saveToDisk();
        return plr;
    }
    public static loadPlayer(id, callback) {
        if (id in players) {
            return process.nextTick(() => {
                callback(null, players[id]);
            });
        }
        fs.readFile('players/' + id + '.plr', (err, data) => {
            if (err) {
                return callback(err);
            }
            const plrdat = JSON.parse('' + data);
            const ret = new Player(id, plrdat.name, Location.fromJSON(plrdat.location));
            ret.loadFromData(plrdat);
            players[ret.id] = ret;
            callback(null, ret);
        });
    }
    public user: User | null;
    public active: boolean;
    public chargen: CharGenStage;
    protected queuedAction: PlayerAction | null;
    constructor(id: string, name: string, loc: Location = new Location(0, 0, '')) {
        super(id, name, 'player', loc);
        this.chargen = CharGenStage.Tutorial;
        this.user = null;
        this.queuedAction = null;
        this.active = false;
    }
    get location(): Location { // Since we override set, we must override get
        return this._location;
    }
    set location(loc: Location) {
        if (this.location.instance_id !== loc.instance_id) {
            const fromInst = Instance.getLoadedInstanceById(this.location.instance_id);
            const toInst = Instance.getLoadedInstanceById(loc.instance_id);
            if (fromInst) {
                fromInst.removePlayer(this);
            }
            if (toInst) {
                toInst.addPlayer(this);
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
                    const success = this.move(this.location.getMovedBy(
                        (this.queuedAction as MoveAction).directionVec.x,
                        (this.queuedAction as MoveAction).directionVec.y),
                    );
                    if (success) {
                        this.charSheet.useAP(ACTION_COST[this.queuedAction.type]);
                    }
                    this.queuedAction = null;
                    break;
                } case ACTION_TYPE.STRAFE: {
                    const success = this.move(this.location.getMovedBy(
                        (this.queuedAction as StrafeAction).directionVec.x,
                        (this.queuedAction as StrafeAction).directionVec.y),
                    );
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
                            portal.reify();
                            this.location = portal.getReifiedDestination();
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
                        opponent.hit(this.charSheet);
                    }
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
        if (Instance.getLoadedInstanceById(this.location.instance_id)) {
            Instance.removeEntityFromWorld(this);
            Instance.getLoadedInstanceById(this.location.instance_id)!.removePlayer(this);
        }
        delete players[this.id];
    }
    public saveToDisk() {
        const data = {
            'name': this.name,
            'chargen': this.chargen,
            'location': this.location.toJSON(),
            'sheet': this.charSheet.toJSON(),
        };
        fs.writeFile('players/' + this.id + '.plr', JSON.stringify(data), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
    public loadFromData(data) {
        this.name = data.name;
        this.chargen = data.chargen;
        // TODO: if player doesn't have location or if it's invalid, or depending on type of instance, or if it no longer exists...
        // ^ cont. then spawn in a new random location?
        if (this.chargen === CharGenStage.Done) {
            // Instance.spawnEntityInLocation(this, data.location);
            CharGen.spawnPlayerInFreshInstance(this);
            // TODO: TEMP ^
        } else {
            CharGen.spawnPlayerInFreshInstance(this);
        }
        this.charSheet = CharacterSheet.fromJSON(data.sheet);
    }
    public pushUpdate() {
        if (this.active) {
            const board = Instance.getPlayerBoard(this);
            this.user!.socket.emit('update', {
                'mobs': board.mobs,
                'tiles': board.tiles,
                'tileAdjacencies': board.tileAdjacencies,
                'portals': board.portals,
                'board_info': board.info,
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
    protected move(to: Location) {
        if (this.location.instance_id !== to.instance_id) {
            return false; // .move() should only be used within an instance
        }
        const inst = Instance.getLoadedInstanceById(this.location.instance_id)!;
        if (!inst.isTilePassable(to.x, to.y)) {
            return false;
        }
        if (inst.getMobInLocation(to.x, to.y)) {
            return false;
        }
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
