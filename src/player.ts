import fs = require('fs');
import uuid = require('uuid/v4');
var nameGen = require('./namegen');
import { Entity, SPRITE, ACTION_STATUS } from './entity';
import { Location } from './location';
import { User } from './user';
import { CharGenStage, CharGen } from './chargen';
import { Instance } from './instance';
import { CharacterSheet } from './charactersheet';

var players = {};

export enum ACTION_TYPE {
    WAIT,
    UNWAIT,
    MOVE,
}

const ACTION_COST = [0, 0, 5];

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
    public direction: string;
    public directionVec: { 'x': number, 'y': number };
    constructor(dir: string) {
        this.direction = dir;
        this.directionVec = { 'x': 0, 'y': 0 };
        if (dir in Instance.directionVectors) {
            const dirVec = Instance.directionVectors[dir];
            this.directionVec.x = dirVec.x;
            this.directionVec.y = dirVec.y;
        } else {
            console.log('Invalid move direction: ' + dir);
        }
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
            'direction': this.direction,
        };
    }
}

export class Player extends Entity {
    static generateNewPlayerID() {
        return uuid();
    }
    static accessPlayer(id) {
        return players[id];
    }
    static createPlayer() {
        var name = nameGen.generateName();
        while (getPlayerByName(name)) {
            name = nameGen.generateName()
        }
        var plr = new Player(this.generateNewPlayerID(), name);
        players[plr.id] = plr;
        CharGen.spawnPlayerInFreshInstance(plr);
        plr.saveToDisk();
        return plr;
    }
    static loadPlayer(id, callback) {
        if (id in players) {
            return process.nextTick(function () {
                callback(null, players[id]);
            });
        } else {
            fs.readFile("players/" + id + '.plr', function (err, data) {
                if (err) {
                    return callback(err);
                } else {
                    var plrdat = JSON.parse('' + data);
                    var ret = new Player(id, plrdat.name, Location.fromJSON(plrdat.location));
                    ret.loadFromData(plrdat);
                    players[ret.id] = ret;
                    callback(null, ret);
                }
            });
        }
    }
    user: User | null;
    active: boolean;
    charSheet: CharacterSheet;
    chargen: CharGenStage;
    protected queuedAction: PlayerAction | null;
    constructor(id: string, name: string, loc: Location = new Location(0, 0, '')) {
        super(id, name, SPRITE.PLAYER, loc);
        this.chargen = CharGenStage.Tutorial;
        this.charSheet = new CharacterSheet;
        this.user = null;
        this.queuedAction = null;
        this.active = false;
    }
    get location(): Location {//Since we override set, we must override get
        return this._location;
    }
    set location(loc: Location) {
        if (this.location.instance_id !== loc.instance_id) {
            const fromInst = Instance.instances[this.location.instance_id];
            const toInst = Instance.instances[loc.instance_id];
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
        Instance.getLoadedInstanceById(this.location.instance_id).notifyOfPlayerAction(this.id);
        this.pushUpdate();
    }
    public removeAction() {
        this.queuedAction = null;
    }
    public doNextAction(): ACTION_STATUS {
        if (this.status.ap === 0) {
            return ACTION_STATUS.WAITING; // can't do anything else
        } else if (this.queuedAction) {
            if (this.status.ap < ACTION_COST[this.queuedAction.type]) {
                return ACTION_STATUS.WAITING; // not enough ap yet
            } else {
                this.status.ap -= ACTION_COST[this.queuedAction.type];
            }
            switch (this.queuedAction.type) {
                case ACTION_TYPE.WAIT:
                    return ACTION_STATUS.WAITING;
                    break;
                case ACTION_TYPE.UNWAIT:
                    this.queuedAction = null;
                    return ACTION_STATUS.ASYNC;
                    break;
                case ACTION_TYPE.MOVE:
                    this.move(this.location.getMovedBy(
                        (this.queuedAction as MoveAction).directionVec.x,
                        (this.queuedAction as MoveAction).directionVec.y),
                    );
                    this.queuedAction = null;
                    break;
            }
            return ACTION_STATUS.PERFORMED;
        } else {
            return ACTION_STATUS.ASYNC; // needs to decide
        }
    }
    setActive(usr: User) {
        if (this.active) {
            //TODO: error?
        }
        this.active = true;
        this.user = usr;
        this.pushUpdate();
    }
    setInactive() {
        if (!this.active) {
            //TODO: error?
        }
        this.active = false;
        this.user = null;
        this.unload();
    }
    unload() {
        this.saveToDisk();
        Instance.removeEntityFromWorld(this);
        Instance.instances[this.location.instance_id].removePlayer(this);
        delete players[this.id];
    }
    saveToDisk() {
        var data = {
            'name': this.name,
            'chargen': this.chargen,
            'location': this.location.toJSON(),
            'status': this.status,
            'sheet': this.charSheet.toJSON(),
        }
        fs.writeFile('players/' + this.id + '.plr', JSON.stringify(data), function (err) {
            if (err) {
                console.log(err);
            }
        });
    }
    loadFromData(data) {
        this.name = data.name;
        this.chargen = data.chargen;
        //TODO: if player doesn't have location or if it's invalid, or depending on type of instance, or if it no longer exists...
        // ^ cont. then spawn in a new random location?
        if (this.chargen == CharGenStage.Done) {
            //Instance.spawnEntityInLocation(this, data.location);
            CharGen.spawnPlayerInFreshInstance(this);
            //TODO: TEMP ^
        } else {
            CharGen.spawnPlayerInFreshInstance(this);
        }
        this.status = data.status;
        this.charSheet = CharacterSheet.fromJSON(data.sheet);
    }
    pushUpdate() {
        if (this.active) {
            let board = Instance.getPlayerBoard(this);
            this.user!.socket.emit('update', {
                'mobs': board.mobs,
                'tiles': board.tiles,
                'board_info': board.info,
                'player': this.getDataAsViewer(),
            });
        } else {
            console.log('Can\'t push update to inactive player');
        }
    }
    getDataAsViewer(viewer?: Player) {
        if (viewer) {
            //TODO: limit data based on line of sight, some attribute (wisdom?) or skill (knowledge skills? perception?)
        }
        return {
            'name': this.name,
            'sheet': this.charSheet.toJSON(),
            'status': this.status,
            'location': this.location.toJSON(),
            'action': this.queuedAction ? this.queuedAction.toJSON() : { 'type': 'NONE' },
        };
    }
    protected move(to: Location) {
        const fromInst = Instance.instances[this.location.instance_id];
        const toInst = Instance.instances[to.instance_id];
        if (toInst.isTilePassable(to.x, to.y)) {
            const mobInWay = toInst.getMobInLocation(to.x, to.y);
            if (mobInWay) {
                mobInWay.hit(1, this.charSheet);
            } else {
                this.location = to.clone();
            }
            if (fromInst.id !== toInst.id) {
                // TODO: instead of sending whole board, send action info so that we can update exactly when necessary
                toInst.updateAllPlayers(); // TODO: is this necessary?  reasoning: players in fromInst WILL be updated at end of update cycle,  toInst could hypothetically not be updated until next update cycle.  (but update cycles should be multiple time per second, so is this necessary?)
            }
        }
    }
    protected handleDeath() {
        Instance.removeEntityFromWorld(this);
        if (this.user) {
            this.user.player = Player.createPlayer();
            this.user.playerid = this.user.player.id;
            this.user.socket.emit('force_disconnect', 'YOU HAVE DIED');
            this.user.logout();
            this.unload();
            //TODO: remove this player from disk?
        }

    }
}

//TODO: remove below or merge as static methods
function getPlayerByName(name) {
    return Object.values(players).find((value: any) => { value.name === name });
}
