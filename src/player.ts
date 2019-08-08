import fs = require('fs');
import uuid = require('uuid/v4');
var nameGen = require('./namegen');
var world = require('./world');
import { Entity } from './entity';
import { Location } from './location';

var players = {};

export class Player extends Entity {
    active: boolean;
    status: any;
    sheet: any;
    constructor(id: string, name: string, location: Location) {
        super(id, name, location);
        this.active = false;
        this.status = {
            'hp': 7,
            'max_hp': 10,
            'sp': 10,
            'max_sp': 10,
            'ap': 0,
            'ap_recovery': 25,
            'max_ap': 60,
        }
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
    move(direction) {
        if (direction in world.directionVectors) {
            var dir = world.directionVectors[direction];
            var newLoc = new Location(
                this.location.x + dir.x,
                this.location.y + dir.y,
                this.location.instance_id);
            world.moveEntity(this, newLoc);
        } else {
            console.log('Invalid move direction: ' + direction);
        }
    }
    setActive() {
        if (this.active) {
            //TODO: error?
        }
        this.active = true;
    }
    setInactive() {
        if (!this.active) {
            //TODO: error?
        }
        this.active = false;
        this.unload();
    }
    unload() {
        delete players[this.id];
        world.removeEntityFromWorld(this);
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
        var plr = new Player(this.generateNewPlayerID(), name, new Location(0, 0, ''));
        players[plr.id] = plr;
        world.spawnInRandomEmptyLocation(plr);
        //savePlayer(plr.id);
        return plr;
    }
    static loadPlayer(id, name) {//TODO remove reliance on name here. load it from file (and therefore decouple player nmae from user name)
        if (id in players) {
            return players[id];
        } else {
            //TODO: load from file
            var plr = new Player(id, name, new Location(0, 0, ''));
            players[plr.id] = plr;
            world.spawnInRandomEmptyLocation(plr);
            return plr;
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