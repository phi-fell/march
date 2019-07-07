(function () {
    function logOn(name) {
        //add player to world
    }
    function logOff(name) {
        //remove player from world
    }
    function accessPlayer(name) {
        return players[name];
    }
    function getPlayerBoard(name) {
        //return section of level around player, with Entities and such limited by what they percieve
    }
    function getPlayerData(name) {
        //return player as it should be seen by client
    }
    var directionVectors = {
        'up': { x: 0, y: -1 },
        'down': { x: 0, y: 1 },
        'left': { x: -1, y: 0 },
        'right': { x: 1, y: 0 },
    };
    function movePlayer(name, direction) {
    }
    module.exports = {
        'directions': directions,
        'logOn': logOn,
        'logOff': logOff,
        'accessPlayer': accessPlayer,
        'getPlayerBoard': getPlayerBoard,
        'getPlayerData': getPlayerData,
    };
}());