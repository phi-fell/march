import { Location } from './location';
import { Instance } from './instance';
import { Entity } from './entity';

function createInstance() {
    var inst: Instance = Instance.generateRandomInstance();
    Instance.instances[inst.id] = inst;
    return inst;
}
function getAnyAvailableInstance() {
    var keys = Object.keys(Instance.instances)
    return Instance.instances[keys[keys.length * Math.random() << 0]];
};

function logOn(id: string) {
    //add player to world
}
function logOff(id: string) {
    //remove player from world
}

function spawnInRandomEmptyLocation(ent: any) {
    //use getAnyAvailableInstance
    do {
        var posX = Math.floor(Math.random() * instance0.board.length);
        var posY = Math.floor(Math.random() * instance0.board[0].length);
    } while (instance0.board[posX][posY] !== undefined);
    ent.location = {
        instance: getAnyAvailableInstance().id,
        x: posX,
        y: posY,
    };
    instance0.board[ent.location.x][ent.location.y] = ent;
}
var directionVectors = {
    'up': { x: 0, y: -1 },
    'down': { x: 0, y: 1 },
    'left': { x: -1, y: 0 },
    'right': { x: 1, y: 0 },
};
var instance0 = createInstance();
Instance.instances[instance0.id] = instance0;
module.exports.directionVectors = directionVectors;
module.exports.logOn = logOn;
module.exports.logOff = logOff;
module.exports.spawnInRandomEmptyLocation = spawnInRandomEmptyLocation;