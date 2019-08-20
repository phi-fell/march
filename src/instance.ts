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
    public static instances: { [key: string]: Instance; } = {};
    public static directionVectors = {
        'up': { 'x': 0, 'y': -1 },
        'down': { 'x': 0, 'y': 1 },
        'left': { 'x': -1, 'y': 0 },
        'right': { 'x': 1, 'y': 0 },
    };
    public static spawnEntityInLocation(ent: Entity, loc: Location) {
        const inst = Instance.instances[loc.instance_id];
        if (inst) {
            inst.spawnEntityAtCoords(ent, loc.x, loc.y);
        } else {
            return console.log('Error! can\'t spawn entity in nonexistent instance!');
        }
    }
    public static removeEntityFromWorld(ent: Entity) {
        Instance.instances[ent.location.instance_id].removeMob(ent);
    }
    public static getLoadedInstanceById(id: string) {
        return Instance.instances[id] || null;
    }
    public static generateNewInstanceID() {
        return uuid();
    }
    public static generateRandomInstance() {
        var attr: InstanceAttributes = new InstanceAttributes(4/* chosen by fair dice roll. guaranteed to be random */, 10, 10);
        return new Instance(this.generateNewInstanceID(), attr);
    }
    public static loadInstance(id: string, callback) {
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
    public static spinUpNewInstance(attr: InstanceAttributes) {
        var inst: Instance = new Instance(this.generateNewInstanceID(), attr);
        Instance.instances[inst.id] = inst;
        return inst;
    }
    public static getAvailableNonFullInstance(plr: Player): Instance | null {
        for (let inst of Object.values(Instance.instances)) {
            if (!inst.attributes.personal) {
                return inst;
            }
        }
        return null;
    }
    public static getPlayerBoard(plr: Player) {
        //return section of level around player, with Entities and such limited by what they percieve
        let retTiles: any = [];
        let retMobs: any = [];
        let inst = Instance.instances[plr.location.instance_id];
        const MAX_RADIUS = 10;
        let x0 = plr.location.x - MAX_RADIUS;
        let y0 = plr.location.y - MAX_RADIUS;
        let x1 = plr.location.x + MAX_RADIUS;
        let y1 = plr.location.y + MAX_RADIUS;
        for (let i = x0; i <= x1; i++) {
            retTiles[i - x0] = [];
            for (let j = y0; j <= y1; j++) {
                if (i < 0 || j < 0 || i >= inst.attributes.width || j >= inst.attributes.height) {
                    retTiles[i - x0][j - y0] = TILE.NONE;
                } else {
                    retTiles[i - x0][j - y0] = inst.tiles[i][j];
                }
            }
        }
        for (const mob of inst.mobs) {
            retMobs.push({
                'name': mob.name,
                'location': mob.location,
                'sprite': mob.sprite,
            });
        }
        return {
            'mobs': retMobs,
            'tiles': retTiles,
            'info': { 'x': x0, 'y': y0, 'w': (x1 - x0) + 1, 'h': (y1 - y0) + 1 },
        };
    }
    players: Player[];
    tiles: TILE[][] = [];
    mobs: Entity[] = [];
    constructor(public id: string, public attributes: InstanceAttributes) {
        this.players = [];
        for (var i = 0; i < attributes.width; i++) {
            this.tiles[i] = [];
            for (var j = 0; j < attributes.height; j++) {
                this.tiles[i][j] = TILE.NONE;
            }
        }
        InstanceGenerator.runGeneration(this);
    }
    addPlayer(player: Player) {
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].id === player.id) {
                return console.log('ERROR! duplicate player ID!'); // no duplicate entries
            }
        }
        this.players.push(player);
        this.addMob(player);
    }
    removePlayer(player: Player) {
        this.removeMob(player);
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].id === player.id) {
                this.players.splice(i, 1);
                return; //no duplicate entries
            }
        }
        console.log('Tried to remove nonexistent player!')
    }
    addMob(mob: Entity) {
        for (const m of this.mobs) {
            if (m.id === mob.id) {
                return console.log('ERROR! duplicate mob ID!');//no duplicate entries
            }
        }
        this.mobs.push(mob);
    }
    removeMob(mob: Entity) {
        for (let i = 0; i < this.mobs.length; i++) {
            if (this.mobs[i].id === mob.id) {
                this.mobs.splice(i, 1);
                return; //no duplicate entries
            }
        }
        console.log('Tried to remove nonexistent mob!');
    }
    updateAllPlayers() {
        for (const plr of this.players) {
            plr.pushUpdate();
        }
    }
    isTilePassable(x: number, y: number) {
        if (x >= 0 && x < this.attributes.width && y >= 0 && y < this.attributes.height) {
            return true;
            // TODO: check for wall
        }
        return false;
    }
    getMobInLocation(x: number, y: number): Entity | null {
        for (const mob of this.mobs) {
            if (mob.location.x === x && mob.location.y === y) {
                return mob;
            }
        }
        return null;
    }
    spawnEntityAtCoords(ent: Entity, x: number, y: number): boolean {
        for (const mob of this.mobs) {
            if (mob.location.x === x && mob.location.y === y) {
                console.log('Error!  can\'t delete entity! (or maybe I should just overwrite it?)');
                return false;
            }
        }
        ent.location = new Location(x, y, this.id);
        return true;

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
}