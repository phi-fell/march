(function () {
    var fs = require('fs');
    var game = require('./game');
    var server = require('./server');
    var player = require('./player');
    var auth = require('./auth');
    var version = require('./version');

    var getHelp = function (socket) {
        socket.emit('chat message', 'HELP DIALOG PLACEHOLDER');//TODO
        socket.emit('chat message', 'GotG V' + version.version + ' Launch_ID[' + version.launch_id + ']');
    }

    var commands = {
        '?': {
            description: 'display help dialog',
            exec: function (socket, tok) {
                getHelp(socket);
            },
        },
        'help': {
            description: 'display help dialog',
            exec: function (socket, tok) {
                getHelp(socket);
            },
        },
        'chargen': {
            description: 'Used during character generation',
            exec: function (socket, tok) {
                game.doCharGen(socket, tok);
            },
        },
        'login': {
            description: '',
            exec: function (socket, tok) {
                if (tok.length < 2) {
                    socket.emit('chat message', "Please enter a username and passphrase");
                } else {
                    auth.validateUser(socket, tok[0], tok.slice(1).join(' '));
                }
            },
        },
        'create': {
            description: '',
            exec: function (socket, tok) {
                if (tok.length < 2) {
                    socket.emit('chat message', "Please enter a username and passphrase");
                } else {
                    auth.createUser(socket, tok[0], tok.slice(1).join(' '));
                }
            },
        },
        'admin': {
            description: '',
            exec: function (socket, tok) {
                if (tok.length >= 2) {
                    fs.readFile("admin/" + tok[0], function (err, data) {
                        if (err) throw err;
                        if (data + '' == tok.slice(1).join(' ')) {
                            clientData[socket.id].user.privilege = 'admin';
                            socket.emit('chat message', "Welcome, Admin.")
                        }
                    });
                }
            },
        },
        'kick': {
            description: '',
            exec: function (socket, tok) {
                if (clientData[socket.id].user.privilege == "admin") {
                    if (tok.length < 1) {
                        socket.emit('chat message', "Please enter a user to kick")
                    } else {
                        recipient = game.getClientIdFromName(tok[0]);
                        if (recipient === undefined) {
                            socket.emit('chat message', "Could not find user " + tok[0])
                        } else {
                            socket.emit('chat message', tok[0] + " kicked");
                            io.to(game.getClientIdFromName(tok[0])).emit('force_disconnect', 'You have been disconnected from the server.');
                            io.sockets.sockets[game.getClientIdFromName(tok[0])].disconnect();
                        }
                    }
                }
            },
        },
        'name': {
            description: '',
            exec: function (socket, tok) {
                var plr = player.accessPlayer(server.accessUserFromSocketId(socket.id).playerId);
                var newName = tok.join(' ');
                var oldName = plr.name;
                plr.name = newName;
                auth.renameUser(oldName, newName);
                socket.emit('cache_user', newName);
                //TODO: handle user credentials in serverjs/auth.js if necessary? (fixing the NAME->ID cache might be sufficient)
                //TODO: recalculate NAME -> ID cache (wherever that ends up being stored);
                socket.broadcast.emit('chat message', plr.name + " has changed their name to " + newName);
                socket.emit('chat message', "you have changed your name to " + newName);
            },
        },
        'pass': {
            description: 'Set password',
            exec: function (socket, tok) {
                auth.setUserPass(server.accessUserFromSocketId(socket).playerId, tok.join(' '));
            }
        },
        'email': {
            description: 'Set email',
            exec: function (socket, tok) {
                socket.emit('chat message', 'this feature has not been implemented yet, sorry');
                //TODO: set email
            }
        },
        'rememberme': {
            description: 'set credential caching length (in days)',
            exec: function (socket, tok) {
                socket.emit('set_credential_cache_days', tok[0]);
            }
        },
        'whisper': {
            description: '',
            exec: function (socket, tok) {
                if (tok.length < 1) {
                    socket.emit('chat message', "Please enter a user to whisper to")
                } else {
                    recipient = game.getClientIdFromName(tok[0]);
                    if (recipient === undefined) {
                        socket.emit('chat message', "Could not find user " + tok[0])
                    } else {
                        socket.emit('chat message', "@" + tok[0] + " << " + tok.slice(1).join(' '));
                        io.to(game.getClientIdFromName(tok[0])).emit('chat message', clientData[socket.id].info.name + " whispered: " + tok.slice(1).join(' '));
                    }
                }
            },
        },
        'move': {
            description: '',
            exec: function (socket, tok) {
                var plr = player.accessPlayer(server.accessUserFromSocketId(socket.id).playerId);
                plr.move(tok[0]);
            },
        }
    }
    function execute(game, socket, cmd, tok) {
        if (commands[cmd]) {
            commands[cmd].exec(socket, tok);
        } else {
            socket.emit('chat message', 'command not recognized: /' + cmd + ' try /help or /?');
        }
    }
    module.exports.execute = execute;
}());