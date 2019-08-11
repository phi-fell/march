var fs = require('fs');
var game = require('./game');
var server = require('./server');
var player = require('./player');
var auth = require('./auth');
var version = require('./version');
import { User } from './user';

var getHelp = function (socket) {
    socket.emit('chat message', 'GotG V' + version.version + ' Launch_ID[' + version.launch_id + ']');
    Object.keys(commands).forEach(cmd => {
        socket.emit('chat message', '/' + cmd + ': ' + commands[cmd].description);
    });
}

var commands: any = {
    '?': {
        description: 'display help dialog',
        exec: function (user: User, tok) {
            getHelp(user.socket);
        },
    },
    'help': {
        description: 'display help dialog',
        exec: function (user: User, tok) {
            getHelp(user.socket);
        },
    },
    'chargen': {
        description: 'Used during character generation',
        exec: function (user: User, tok) {
            game.doCharGen(user.socket, tok);
        },
    },
    'admin': {
        description: '',
        exec: function (user: User, tok) {
            /*
            if (tok.length >= 2) {
                fs.readFile("admin/" + tok[0], function (err, data) {
                    if (err) throw err;
                    if (data + '' == tok.slice(1).join(' ')) {
                        clientData[socket.id].user.privilege = 'admin';
                        socket.emit('chat message', "Welcome, Admin.")
                    }
                });
            }
            */
        },
    },
    'kick': {
        description: '',
        exec: function (user: User, tok) {
            /*
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
            */
        },
    },
    'name': {
        description: 'Change player\'s name',
        exec: function (user: User, tok) {
            var newName: string = tok.join(' ');
            if (newName.length > 16) {
                user.socket.emit('chat message', 'That name is too long.');
            } else {
                var oldName = user.player.name;
                user.player.name = tok.join(' ');
                user.socket.broadcast.emit('chat message', oldName + " has changed their name to " + user.player.name);
                user.socket.emit('chat message', "you have changed your name to " + user.player.name);
            }
        },
    },
    'email': {
        description: 'Set email',
        exec: function (user: User, tok) {
            if (tok.length > 0) {
                user.email = tok.join(' ');
                user.socket.emit('chat message', 'Your email has been set to "' + user.email + '"');
            } else if (user.email) {
                user.socket.emit('chat message', 'Your email is "' + user.email + '" use /email <new_email> to change it.');
            } else {
                user.socket.emit('chat message', 'You have no email set.  use /email <new_email> to set it.');
            }
        }
    },
    'whisper': {
        description: '',
        exec: function (user: User, tok) {
            /*
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
            */
        },
    },
    'move': {
        description: 'Move in a direction',
        exec: function (user: User, tok) {
            user.player.move(tok[0]);
        },
    }
}
function execute(user: User, cmd, tok) {
    if (commands[cmd]) {
        commands[cmd].exec(user, tok);
    } else {
        user.socket.emit('chat message', 'command not recognized: /' + cmd + ' try /help or /?');
    }
}
module.exports.execute = execute;