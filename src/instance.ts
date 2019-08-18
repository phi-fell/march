import fs = require('fs');
import uuid = require('uuid/v4');
import { Entity } from './entity';
import { INSTANCE_GEN_TYPE, InstanceGenerator } from './instancegenerator';
import { Location } from './location';
import { Player } from './player';

export class InstanceAttributes {
    public genType: INSTANCE_GEN_TYPE = INSTANCE_GEN_TYPE.EMPTY;
    constructor(public seed: number/*TODO: string?*/,
        public width: number,
        public height: number,
        public personal: boolean = false, ) {
    }
    clone() {
        return new InstanceAttributes(this.seed, this.width, this.height, this.personal);
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

export enum TILE {
    NONE,
    UNKNOWN,
    STONE_FLOOR,
    STONE_WALL,
}

export class Instance {
    static instances: { [key: string]: Instance; } = {};
    players: Player[];
    tiles: TILE[][] = [];
    board: (Entity | undefined)[][] = [];//TODO move board to instance
    constructor(public id: string, public attributes: InstanceAttributes) {
        this.players = [];
        for (var i = 0; i < attributes.width; i++) {
            this.board[i] = [];
            this.tiles[i] = [];
            for (var j = 0; j < attributes.height; j++) {
                this.board[i][j] = undefined;
                this.tiles[i][j] = TILE.NONE;
            }
        }
        InstanceGenerator.runGeneration(this);
    }
    addPlayer(player: Player) {
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].id === player.id) {
                return;//no duplicate entries
            }
        }
        this.players.push(player);

    }
    removePlayer(player: Player) {
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].id === player.id) {
                this.players.splice(i, 1);
                return;//no duplicate entries
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
        var retBoard: any = [];//TODO move board to instance
        var retTiles: any = [];//TODO move board to instance
        var inst = Instance.instances[plr.location.instance_id];
        const MAX_RADIUS = 10;
        let x0 = plr.location.x - MAX_RADIUS
        let y0 = plr.location.y - MAX_RADIUS
        let x1 = plr.location.x + MAX_RADIUS
        let y1 = plr.location.y + MAX_RADIUS
        for (let i = x0; i <= x1; i++){
            retTiles[i-x0] = [];
            retBoard[i-x0] = [];
            for (let j = y0; j <= y1; j++){
                if (i < 0 || j < 0 || i >= inst.attributes.width || j >= inst.attributes.height){
                    retTiles[i-x0][j-y0] = TILE.NONE;
                    retBoard[i-x0][j-y0] = undefined;
                } else {
                    retTiles[i-x0][j-y0] = inst.tiles[i][j];
                    if (inst.board[i][j] === undefined) {
                        retBoard[i-x0][j-y0] = undefined;
                    } else {
                        retBoard[i-x0][j-y0] = {
                            'name': inst.board[i][j]!.name,
                            'location': inst.board[i][j]!.location,
                        };
                    }
                }
            }
        }
        return {
            'board': retBoard,
            'tiles': retTiles,
        };
    }
}