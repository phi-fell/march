(function () {
    var uuid = require('uuid/v4');
    var world = require('./world');
    class Entity {
        constructor(id, name) {
            this.id = id;
            this.name = name;
        }
    }
    var players = {};
    function generateNewEntityID() {
        return uuid();
    }
    function generateNewPlayerName() {
        var genName = wordList[Math.floor(Math.random() * wordList.length)];
        while (getClientIdFromName(genName) !== undefined || genName.length > 10) {
            genName = wordList[Math.floor(Math.random() * wordList.length)];
        }
        genName = genName + '' + Math.floor(Math.random() * 10) + '' + Math.floor(Math.random() * 10) + '' + Math.floor(Math.random() * 10)
    }
    function createPlayer() {
        var plr = new Player(generateNewPlayerID(), generateNewPlayerName());

        players[plr.id] = plr;
        savePlayer(plr.id);
        return plr;
    }
    function getPlayerByName(name) {
        return Object.values(players).find(value => value.name === name);
    }
    module.exports = {
        'createPlayer': createPlayer,
        'getPlaterByName': getPlayerByName,
    };
}());