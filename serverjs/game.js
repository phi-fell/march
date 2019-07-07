(function () {
    var fs = require('fs');

    var chargenStages = ['a character origin', 'character attributes', 'your character\'s skills'];
    var chargenCommands = ['origin', 'attributes', 'skills'];
    function tryPromptCharacterCreation(socket) {
        if (clientData[socket.id].hasOwnProperty('player') && !clientData[socket.id].player.created) {
            let stage = clientData[socket.id].player.creation_stage;
            socket.emit('chat message', 'please choose ' + chargenStages[stage] + ' with /chargen ' + chargenCommands[stage]);
        }
    }
    function doCharGen(socket, tok) {
        if (clientData[socket.id].hasOwnProperty('player')) {
            if (clientData[socket.id].player.created) {
                socket.emit('chat message', "Your player is done with character generation");
            } else {
                if (tok.length < 1) {
                    tryPromptCharacterCreation(socket);
                } else {
                    if (tok[0] === chargenCommands[clientData[socket.id].player.creation_stage]) {
                        if (tok[0] === 'origin') {
                            socket.emit('chat message', "Choosing origin is an in developement feature");
                            //TODO
                        }
                    } else {
                        tryPromptCharacterCreation(socket);
                    }
                }
            }
        } else {
            socket.emit('chat message', "First, use /login to play an existing char, or create one with /create");
        }


    }
    function loadPlayer(socket, name) {
        fs.readFile("users/" + name + ".plr", function (err, data) {
            if (err) {
                console.log(err);
                socket.emit('chat message', "Could not load player");
            } else {
                clientData[socket.id].player = JSON.parse(data);
                socket.emit('chat message', "Welcome, " + name + "!");
                tryPromptCharacterCreation(socket);
            }
        });
    }
    function createPlayer(socket, name) {
        var player = {
            'name': name,
            'created': false,
            'creation_stage': 0
        }
        fs.writeFile("users/" + name + '.plr', JSON.stringify(player), function (err) {
            if (err) {
                console.log(err);
                socket.emit('chat message', "User creation Failed!");
            } else {
                socket.emit('chat message', "User successfully created!");
                loadPlayer(socket, name);
            }
        });
    }

    module.exports.loadPlayer = loadPlayer;
    module.exports.createPlayer = createPlayer;
    module.exports.doCharGen = doCharGen;
}());