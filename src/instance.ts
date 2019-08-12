import uuid = require('uuid/v4');
import fs = require('fs');
import { Entity } from './entity';
import { Player } from './player';
import { World } from './world';

export class Instance {
    players: Player[];
    board: (Entity | undefined)[][] = [];//TODO move board to instance
    constructor(public id: string, public attributes: InstanceAttributes) {
        this.players = [];
        for (var i = 0; i < attributes.width; i++) {
            this.board[i] = [];
            for (var j = 0; j < attributes.height; j++) {
                this.board[i][j] = undefined;
            }
        }
    }
    updateAllPlayers() {
        for (var plr of this.players) {
            plr.pushUpdate();
        }
    }
    saveToDisk() {
        var playerids: string[] = [];
        for (var plr of this.players) {
            playerids.push(plr.id);
        }
        var data = {
            'attributes': this.attributes.getJSON(),
            'players': playerids,
        }
        fs.writeFile('world/' + this.id + '.inst', JSON.stringify(data), function (err) {
            if (err) {
                console.log(err);
            }
        });
    }
    loadFromJSON(data) {
        this.attributes.loadFromJSON(data.attributes);
        this.players = [];
        var instance = this;
        for (var plrid of data.players) {
            Player.loadPlayer(plrid, function (err: any, plr: Player) {
                if (err) {
                    return console.log(err);
                }
                instance.players.push(plr);
            });
        }
    }
    static generateNewInstanceID() {
        return uuid();
    }
    static generateRandomInstance() {
        var attr: InstanceAttributes = new InstanceAttributes(4/* chosen by fair dice roll. guaranteed to be random */, 10, 10);
        return new Instance(this.generateNewInstanceID(), attr);
    }
    static loadInstance(id: string, callback) {
        var loaded = World.getLoadedInstanceById(id);
        if (loaded) {
            return callback(null, loaded);
        } else {
            fs.readFile("world/" + id + '.inst', function (err, data) {
                if (err) {
                    return callback(err);
                } else {
                    var instdat = JSON.parse('' + data);
                    var ret = new Instance(id, new InstanceAttributes(0, 0, 0));
                    ret.loadFromJSON(instdat);
                    World.instances[ret.id] = ret;
                    callback(null, ret);
                }
            });
        }
    }
}
export class InstanceAttributes {
    constructor(public seed: number/*TODO: string?*/,
        public width: number,
        public height: number) {
    }
    getJSON() {
        return {
            'seed': this.seed,
            'width': this.width,
            'height': this.height,
        };
    }
    loadFromJSON(data) {
        this.seed = data.seed;
        this.width = data.width;
        this.height = data.height;
    }
}