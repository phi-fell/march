import { Player } from './player';
import { Location } from './location';
import { Instance } from './instance';
import { Entity } from './entity';

export class World {
    static instances: { [key: string]: Instance; } = {};
    static getLoadedInstanceById(id: string) {
        return World.instances[id] || null;
    }
}

function createInstance() {
    var inst: Instance = Instance.generateRandomInstance();
    World.instances[inst.id] = inst;
    return inst;
}
function getAnyAvailableInstance() {
    var keys = Object.keys(World.instances)
    return World.instances[keys[keys.length * Math.random() << 0]];
};

var board: (Entity | undefined)[][] = [];//TODO move board to instance
for (var i = 0; i < 10; i++) {
    board[i] = [];
    for (var j = 0; j < 10; j++) {
        board[i][j] = undefined;
    }
}

function logOn(id: string) {
    //add player to world
}
function logOff(id: string) {
    //remove player from world
}
function getPlayerBoard(pId: string) {
    //return section of level around player, with Entities and such limited by what they percieve
    var ret: any = [];//TODO move board to instance
    for (var i = 0; i < 10; i++) {
        ret[i] = [];
        for (var j = 0; j < 10; j++) {
            if (board[i][j] === undefined) {
                ret[i][j] = undefined;
            } else {
                ret[i][j] = {
                    'name': board[i][j]!.name,
                    'location': board[i][j]!.location,
                };
            }
        }
    }
    return ret;
}
function spawnInRandomEmptyLocation(ent: any) {
    //use getAnyAvailableInstance
    do {
        var posX = Math.floor(Math.random() * board.length);
        var posY = Math.floor(Math.random() * board[0].length);
    } while (board[posX][posY] !== undefined);
    ent.location = {
        instance: getAnyAvailableInstance().id,
        x: posX,
        y: posY,
    };
    board[ent.location.x][ent.location.y] = ent;
}
function removeEntityFromWorld(ent: Entity) {
    board[ent.location.x][ent.location.y] = undefined;
}
function moveEntity(entity: Entity, to: Location) {
    if (to.x >= 0 && to.x < board.length && to.y >= 0 && to.y < board[0].length) {
        if (board[to.x][to.y] === undefined) {
            board[entity.location.x][entity.location.y] = undefined;
            board[to.x][to.y] = entity;
            entity.location = to;
        } else {
            board[to.x][to.y]!.hit(1);
            //TODO update instance board[to.x][to.y].location.instance_id

        }
        //TODO: update clients
    }
}
var directionVectors = {
    'up': { x: 0, y: -1 },
    'down': { x: 0, y: 1 },
    'left': { x: -1, y: 0 },
    'right': { x: 1, y: 0 },
};
var instance0 = createInstance();
World.instances[instance0.id] = instance0;
module.exports.directionVectors = directionVectors;
module.exports.logOn = logOn;
module.exports.logOff = logOff;
module.exports.getPlayerBoard = getPlayerBoard;
module.exports.spawnInRandomEmptyLocation = spawnInRandomEmptyLocation;
module.exports.moveEntity = moveEntity;
module.exports.removeEntityFromWorld = removeEntityFromWorld;