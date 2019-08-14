import fs = require('fs');
import uuid = require('uuid/v4');
var nameGen = require('./namegen');
var world = require('./world');
import { Entity } from './entity';
import { Location } from './location';
import { User } from './user';
import { CharGenStage, CharGen } from './chargen';
import { Instance } from './instance';

var players = {};

export class Player extends Entity {
    user: User | null;
    active: boolean;
    sheet: any;
    chargen: CharGenStage;
    origin: string | null;
    constructor(id: string, name: string, location: Location = new Location(0, 0, '')) {
        super(id, name, location);
        this.chargen = CharGenStage.Tutorial;
        this.origin = null;
        this.user = null;
        this.active = false;
        this.sheet = {
            'BOD': {
                'STR': 1,
                'END': 2,
                'CON': 3
            }, 'MOV': {
                'AGI': 4,
                'DEX': 5,
                'SPD': 6
            }, 'MNT': {
                'CHA': 7,
                'LOG': 8,
                'WIS': 9
            }, 'OTH': {
                'MEM': 10,
                'WIL': 11,
                'LCK': 12
            }, 'MNA': {
                'CAP': 13,
                'CND': 14,
                'GEN': 15
            }, 'FTH': {
                'CVN': 16,
                'PTY': 17,
                'FVR': 18
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
            //TODO: remove this player from disk?
        }

    }
    moveInDirection(direction) {
        if (direction in world.directionVectors) {
            var dir = world.directionVectors[direction];
            var newLoc = new Location(
                this.location.x + dir.x,
                this.location.y + dir.y,
                this.location.instance_id);
            this.move(newLoc);
        } else {
            console.log('Invalid move direction: ' + direction);
        }
    }
    move(to: Location) {
        if (this.location.instance_id !== to.instance_id) {
            Instance.instances[this.location.instance_id].removePlayer(this);
            Instance.instances[to.instance_id].addPlayer(this);
        }
        super.move(to);
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
        delete players[this.id];
    }
    saveToDisk() {
        var data = {
            'name': this.name,
            'chargen': this.chargen,
            'location': this.location,
            'status': this.status,
            'sheet': this.sheet,
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
        this.sheet = data.sheet;
    }
    pushUpdate() {
        if (this.active) {
            this.user!.socket.emit('update', {
                'board': Instance.getPlayerBoard(this),
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
            'sheet': this.sheet,
            'status': this.status,
            'location': this.location,
        };
    }

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
                    var ret = new Player(id, plrdat.name, plrdat.location);
                    ret.loadFromData(plrdat);
                    players[ret.id] = ret;
                    //world.spawnInRandomEmptyLocation(ret);//TODO: this should not always be the behavior
                    callback(null, ret);
                }
            });
        }
    }
}

//TODO: remove below or merge as static methods
function getPlayerByName(name) {
    return Object.values(players).find((value: any) => { value.name === name });
}
function deletePlayerById(id) {
    delete players[id];
}
module.exports.getPlayerByName = getPlayerByName;
module.exports.deletePlayerById = deletePlayerById