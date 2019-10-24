import fs = require('fs');

import { ACTION_STATUS, Entity } from './entity';
import { INSTANCE_GEN_TYPE, InstanceGenerator } from './instancegenerator';
import { InstanceSchemaID } from './instanceschema';
import { Location } from './location';
import { Random } from './math/random';
import { Player } from './player';
import { Portal } from './portal';
import { getTileProps, NO_TILE, Tile } from './tile';

const MAX_INACTIVE_TIME = 1000 * 60 * 10; // 10 minutes (as milliseconds)

export class InstanceAttributes {
    public genType: INSTANCE_GEN_TYPE = INSTANCE_GEN_TYPE.EMPTY;
    public schemaID: InstanceSchemaID = '';
    constructor(
        public seed: string = Random.uuid(),
        public width: number,
        public height: number,
        public personal: boolean = false,
    ) { }
    public clone() {
        const ret = new InstanceAttributes(this.seed, this.width, this.height, this.personal);
        ret.genType = this.genType;
        ret.schemaID = this.schemaID;
        return ret;
    }
    public getJSON() {
        return {
            'seed': this.seed,
            'width': this.width,
            'height': this.height,
            'personal': this.personal,
        };
    }
    public loadFromJSON(data) {
        this.seed = data.seed;
        this.width = data.width;
        this.height = data.height;
        this.personal = data.personal;
    }
}

export class Instance {
    public static instances: { [key: string]: Instance; } = {};
    public static spawnEntityInLocation(ent: Entity, loc: Location) {
        const inst = Instance.instances[loc.instance_id];
        if (inst) {
            inst.spawnEntityAtCoords(ent, loc.x, loc.y);
        } else {
            return console.log('Error! can\'t spawn entity in nonexistent instance!');
        }
    }
    public static removeEntityFromWorld(ent: Entity) {
        if (Instance.instances[ent.location.instance_id]) {
            Instance.instances[ent.location.instance_id].removeMob(ent);
        }
    }
    public static getLoadedInstanceById(id: string): Instance | null {
        return Instance.instances[id] || null;
    }
    public static generateNewInstanceID() {
        return Random.uuid();
    }
    public static loadInstance(id: string, callback) {
        const loaded = Instance.getLoadedInstanceById(id);
        if (loaded) {
            return callback(null, loaded);
        }
        fs.readFile('world/' + id + '.inst', (err, data) => {
            if (err) {
                return callback(err);
            }
            const instdat = JSON.parse('' + data);
            const ret = new Instance(id, new InstanceAttributes(Random.uuid(), 0, 0));
            ret.loadFromJSON(instdat);
            Instance.instances[ret.id] = ret;
            callback(null, ret);
        });
    }
    public static spinUpNewInstance(attr: InstanceAttributes) {
        const inst: Instance = new Instance(Instance.generateNewInstanceID(), attr);
        Instance.instances[inst.id] = inst;
        return inst;
    }
    public static getAvailableNonFullInstance(plr: Player): Instance | null {
        for (const inst of Object.values(Instance.instances)) {
            if (!inst.attributes.personal) {
                return inst;
            }
        }
        return null;
    }
    public static getPlayerBoard(plr: Player) {
        // return section of level around player, with Entities and such limited by what they percieve
        const retTiles: Tile[][] = [];
        const retMobs: any = [];
        const retPortals: any = [];
        const inst = Instance.instances[plr.location.instance_id];
        const MAX_RADIUS = 10;
        const x0 = plr.location.x - MAX_RADIUS;
        const y0 = plr.location.y - MAX_RADIUS;
        const x1 = plr.location.x + MAX_RADIUS;
        const y1 = plr.location.y + MAX_RADIUS;
        for (let i = x0; i <= x1; i++) {
            retTiles[i - x0] = [];
            for (let j = y0; j <= y1; j++) {
                if (i < 0 || j < 0 || i >= inst.attributes.width || j >= inst.attributes.height) {
                    retTiles[i - x0][j - y0] = NO_TILE;
                } else {
                    retTiles[i - x0][j - y0] = inst.tiles[i][j];
                }
            }
        }
        for (const mob of inst.mobs) {
            retMobs.push({
                'name': mob.name,
                'location': mob.location,
                'direction': mob.direction,
                'type': mob.schema_id,
                'sheet': mob.charSheet.toJSON(), // TODO: limit what player can see
            });
        }
        for (const portal of inst.portals) {
            if (portal.location.x >= x0 && portal.location.x <= x1 && portal.location.y >= y0 && portal.location.y <= y1) {
                retPortals.push({
                    'location': portal.location,
                });
            }
        }
        return {
            'mobs': retMobs,
            'portals': retPortals,
            'tiles': retTiles,
            'info': {
                'x': x0, 'y': y0,
                'w': (x1 - x0) + 1, 'h': (y1 - y0) + 1,
                'your_turn': inst.waitingForAsyncMove === plr.id,
            },
        };
    }
    public static updateAll() {
        for (const inst of Object.values(Instance.instances)) { // TODO: use map? instead of object
            inst.update();
        }
    }
    public players: Player[];
    public tiles: Tile[][] = [];
    public mobs: Entity[] = [];
    public portals: Portal[] = [];
    private waitingForAsyncMove: string | null;
    private lastActiveTime: number;
    constructor(public id: string, public attributes: InstanceAttributes) {
        this.waitingForAsyncMove = null;
        this.lastActiveTime = Date.now();
        this.players = [];
        for (let i = 0; i < attributes.width; i++) {
            this.tiles[i] = [];
            for (let j = 0; j < attributes.height; j++) {
                this.tiles[i][j] = NO_TILE;
            }
        }
        InstanceGenerator.runGeneration(this);
    }
    public getMillisUntilUnload(): number {
        return MAX_INACTIVE_TIME - (Date.now() - this.lastActiveTime);
    }
    public addPlayer(player: Player) {
        for (const p of this.players) {
            if (p.id === player.id) {
                return console.log('ERROR! duplicate player ID!'); // no duplicate entries
            }
        }
        this.players.push(player);
        this.addMob(player);
    }
    public removePlayer(player: Player) {
        this.removeMob(player);
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].id === player.id) {
                this.players.splice(i, 1);
                if (this.waitingForAsyncMove === player.id) {
                    this.waitingForAsyncMove = null;
                }
                return; // no duplicate entries
            }
        }
        console.log('Tried to remove nonexistent player!');
    }
    public addMob(mob: Entity) {
        for (const m of this.mobs) {
            if (m.id === mob.id) {
                return console.log('ERROR! duplicate mob ID!'); // no duplicate entries
            }
        }
        this.mobs.push(mob);
    }
    public removeMob(mob: Entity) {
        for (let i = 0; i < this.mobs.length; i++) {
            if (this.mobs[i].id === mob.id) {
                this.mobs.splice(i, 1);
                return; // no duplicate entries
            }
        }
        console.log('Tried to remove nonexistent mob!');
    }
    public updateAllPlayers() {
        for (const plr of this.players) {
            plr.pushUpdate();
        }
    }
    public isTilePassable(x: number, y: number) {
        if (x >= 0 && x < this.attributes.width && y >= 0 && y < this.attributes.height) {
            if (getTileProps(this.tiles[x][y]).passable) {
                return true;
            }
        }
        return false;
    }
    public getMobInLocation(x: number, y: number): Entity | null {
        for (const mob of this.mobs) {
            if (mob.location.x === x && mob.location.y === y) {
                return mob;
            }
        }
        return null;
    }
    public spawnEntityAtCoords(ent: Entity, x: number, y: number): boolean {
        if (!this.isTilePassable(x, y)) {
            console.log('Error!  can\'t spawn entity on impassable tile!');
            return false;
        }
        for (const mob of this.mobs) {
            if (mob.location.x === x && mob.location.y === y) {
                console.log('Error!  can\'t delete entity! (or maybe I should just overwrite it?)');
                return false;
            }
        }
        ent.location = new Location(x, y, this.id);
        return true;
    }
    public spawnEntityAnywhere(ent: Entity): boolean {
        let posX: number;
        let posY: number;
        let validpos = false;
        let attempts = 0;
        do {
            attempts++;
            posX = Math.floor(Math.random() * this.attributes.width);
            posY = Math.floor(Math.random() * this.attributes.height);
            if (this.isTilePassable(posX, posY)) {
                validpos = true;
                for (const mob of this.mobs) {
                    if (mob.location.x === posX && mob.location.y === posY) {
                        validpos = false;
                    }
                }
            }
            if (attempts > 1000) {
                console.log('Could not spawn mob after 1000 attempts!');
                return false;
            }
        } while (!validpos);
        ent.location = new Location(posX, posY, this.id);
        return true;

    }
    public unload() {
        delete Instance.instances[this.id];
    }
    public saveToDisk() {
        const playerids: string[] = [];
        for (const plr of this.players) {
            playerids.push(plr.id);
        }
        const data = {
            'attributes': this.attributes.getJSON(),
            'players': playerids,
        };
        fs.writeFile('world/' + this.id + '.inst', JSON.stringify(data), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
    public loadFromJSON(data) {
        this.attributes.loadFromJSON(data.attributes);
        this.players = [];
        const instance = this;
        for (const plrid of data.players) {
            Player.loadPlayer(plrid, (err: any, plr: Player) => {
                if (err) {
                    return console.log(err);
                }
                instance.players.push(plr);
            });
        }
    }
    public emit(event: string) {
        // TODO: give events a type, location, etc.  and only emit to some players
        for (const plr of this.players) {
            plr.user!.socket.emit('chat message', event);
        }
    }
    public notifyOfPlayerAction(pID: string) {
        if (this.waitingForAsyncMove === pID) {
            this.waitingForAsyncMove = null;
            this.update();
        }
    }
    public update() {
        if (this.players.length <= 0) {
            if (Date.now() - this.lastActiveTime > MAX_INACTIVE_TIME) {
                this.unload(); // unload empty instances after 10 minutes
            }
            return;
        }
        this.lastActiveTime = Date.now();
        if (this.waitingForAsyncMove) {
            return; // waiting on a player
        }
        for (let i = this.mobs.length; i > 0; i--) {
            if (!this.performNextEntityAction()) {
                break;
            }
        }
        this.updateAllPlayers();
    }
    private performNextEntityAction() {
        if (this.mobs.length <= 0) {
            return false; // no mobs to act
        }
        this.mobs.sort((a, b) => b.charSheet.getInitiative() - a.charSheet.getInitiative()); // TODO: handle ties?
        for (const mob of this.mobs) {
            const actionStatus = mob.doNextAction();
            if (actionStatus === ACTION_STATUS.WAITING) {
                mob.charSheet.startRest();
            } else if (actionStatus === ACTION_STATUS.PERFORMED) {
                mob.charSheet.endRest();
                return true;
            } else if (actionStatus === ACTION_STATUS.ASYNC) {
                this.waitingForAsyncMove = mob.id;
                (mob as Player).pushUpdate();
                return false;
            }
        }
        this.startNewTurn();
        return true;
    }
    private startNewTurn() {
        this.emit('A new round has begun!');
        for (const mob of this.mobs) {
            mob.startNewTurn();
        }
    }
}
