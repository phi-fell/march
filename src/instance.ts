import uuid = require('uuid/v4');
import fs = require('fs');
import { Entity } from './entity';
import { Player } from './player';
import { Location } from './location';

export class InstanceAttributes {
    constructor(public seed: number/*TODO: string?*/,
        public width: number,
        public height: number,
        public personal: boolean = false, ) {
    }
    getJSON() {
        return {
            'seed': this.seed,
            'width': this.width,
            'height': this.height,
            'personal': this.personal,
        };
    }
    loadFromJSON(data) {
        this.seed = data.seed;
        this.width = data.width;
        this.height = data.height;
        this.personal = data.personal;
    }
}

export class Instance {
    static instances: { [key: string]: Instance; } = {};
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
    spawnEntityAtCoords(ent: Entity, x: number, y: number) {
        if (this.board[x][y]) {
            return console.log('Error!  can\'t delete entity! (or maybe I should just overwrite it?)');
        } else {
            ent.location = new Location(x, y, this.id);
            this.board[x][y] = ent;
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
    static spawnEntityInLocation(ent: Entity, loc: Location) {
        var inst = Instance.instances[loc.instance_id];
        if (inst) {
            inst.spawnEntityAtCoords(ent, loc.x, loc.y);
        } else {
            return console.log('Error! can\'t spawn entity in nonexistent instance!');
        }
    } static removeEntityFromWorld(ent: Entity) {
        Instance.instances[ent.location.instance_id].board[ent.location.x][ent.location.y] = undefined;
    }
    static moveEntity(entity: Entity, to: Location) {
        var fromInst = Instance.instances[entity.location.instance_id];
        var toInst = Instance.instances[to.instance_id];
        if (to.x >= 0 && to.x < toInst.board.length && to.y >= 0 && to.y < toInst.board[0].length) {
            if (toInst.board[to.x][to.y] === undefined) {
                fromInst.board[entity.location.x][entity.location.y] = undefined;
                toInst.board[to.x][to.y] = entity;
                entity.location = to.clone();
            } else {
                toInst.board[to.x][to.y]!.hit(1);
                //TODO update instance iboard[to.x][to.y].location.instance_id

            }
            //TODO: update clients
        }
    }
    static getLoadedInstanceById(id: string) {
        return Instance.instances[id] || null;
    }
    static generateNewInstanceID() {
        return uuid();
    }
    static generateRandomInstance() {
        var attr: InstanceAttributes = new InstanceAttributes(4/* chosen by fair dice roll. guaranteed to be random */, 10, 10);
        return new Instance(this.generateNewInstanceID(), attr);
    }
    static loadInstance(id: string, callback) {
        var loaded = Instance.getLoadedInstanceById(id);
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
                    Instance.instances[ret.id] = ret;
                    callback(null, ret);
                }
            });
        }
    }
    static spinUpNewInstance(attr: InstanceAttributes) {
        var inst: Instance = new Instance(this.generateNewInstanceID(), attr);
        Instance.instances[inst.id] = inst;
        return inst;
    }
    static getAvailableNonFullInstance(plr: Player): Instance | null {
        for (let inst of Object.values(Instance.instances)) {
            if (!inst.attributes.personal) {
                return inst;
            }
        }
        return null;
    }
    static getPlayerBoard(plr: Player) {
        //return section of level around player, with Entities and such limited by what they percieve
        var ret: any = [];//TODO move board to instance
        var inst = Instance.instances[plr.location.instance_id];
        for (var i = 0; i < inst.attributes.width; i++) {
            ret[i] = [];
            for (var j = 0; j < inst.attributes.height; j++) {
                if (inst.board[i][j] === undefined) {
                    ret[i][j] = undefined;
                } else {
                    ret[i][j] = {
                        'name': inst.board[i][j]!.name,
                        'location': inst.board[i][j]!.location,
                    };
                }
            }
        }
        return ret;
    }
}