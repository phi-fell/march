import fs = require('fs');
import uuid = require('uuid/v4');
var nameGen = require('./namegen');
var world = require('./world');
import { Entity } from './entity';
import { Location } from './location';
import { User } from './user';
import { CharGenStage, CharGen } from './chargen';
import { Instance } from './instance';
import { CharacterSheet } from './charactersheet';

var players = {};

export class Player extends Entity {
    user: User | null;
    active: boolean;
    charSheet: CharacterSheet;
    chargen: CharGenStage;
    constructor(id: string, name: string, _location: Location = new Location(0, 0, '')) {
        super(id, name, _location);
        this.chargen = CharGenStage.Tutorial;
        this.charSheet = new CharacterSheet;
        this.user = null;
        this.active = false;
    }
    get location(): Location {//Since we override set, we must override get
        return this._location;
    }
    set location(loc: Location) {
        if (this.location.instance_id !== loc.instance_id) {
            var fromInst = Instance.instances[this.location.instance_id];
            if (fromInst) {
                Instance.instances[this.location.instance_id].removePlayer(this);
            }
            Instance.instances[loc.instance_id].addPlayer(this);
        }
        this._location = loc;
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
                'board': board.board,
                'tiles': board.tiles,
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
                    var ret = new Player(id, plrdat.name, Location.fromJSON(plrdat.location));
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