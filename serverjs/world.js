(function () {
    var uuid = require('uuid/v4');
    var player = require('./player');
    var instances = {};
    function generateNewInstanceID() {
        return uuid();
    }
    function createInstance() {
        var inst = {
            id: generateNewInstanceID(),
        }
        instances[inst.id] = inst;
        return inst;
    }
    function getAnyAvailableInstance() {
        var keys = Object.keys(instances)
        return instances[keys[keys.length * Math.random() << 0]];
    };

    board = [];//TODO move board to instance
    for (var i = 0; i < 10; i++) {
        board[i] = [];
        for (var j = 0; j < 10; j++) {
            board[i][j] = undefined;
        }
    }

    function logOn(id) {
        //add player to world
    }
    function logOff(id) {
        //remove player from world
    }
    function getPlayerBoard(pId) {
        //return section of level around player, with Entities and such limited by what they percieve
        return board;
    }
    function getPlayerData(pId) {
        //return player as it should be seen by client
        return player.accessPlayer(pId);
    }
    function spawnInRandomEmptyLocation(ent) {
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
    function removeEntityFromWorld(ent) {
        board[ent.location.x][ent.location.y] = undefined;
    }
    function moveEntity(entity, to) {
        if (to.x >= 0 && to.x < board.length && to.y >= 0 && to.y < board[0].length && board[to.x][to.y] === undefined) {
            board[entity.location.x][entity.location.y] = undefined;
            board[to.x][to.y] = entity;
            entity.location = to;
        }
    }
    var directionVectors = {
        'up': { x: 0, y: -1 },
        'down': { x: 0, y: 1 },
        'left': { x: -1, y: 0 },
        'right': { x: 1, y: 0 },
    };
    var instance0 = createInstance();
    instances[instance0.id] = instance0;
    module.exports.directionVectors = directionVectors;
    module.exports.logOn = logOn;
    module.exports.logOff = logOff;
    module.exports.getPlayerBoard = getPlayerBoard;
    module.exports.getPlayerData = getPlayerData;
    module.exports.spawnInRandomEmptyLocation = spawnInRandomEmptyLocation;
    module.exports.moveEntity = moveEntity;
    module.exports.removeEntityFromWorld = removeEntityFromWorld;
}());