import fs = require('fs');

import { Instance } from './instance';
import { Random } from './math/random';
import { MoveAction } from './player';
import { User } from './user';
import { launch_id, version } from './version';

function getHelp(socket) {
    socket.emit('chat message', 'GotG V' + version + ' Launch_ID[' + launch_id + ']');
    Object.keys(commands).forEach(cmd => {
        socket.emit('chat message', '/' + cmd + ': ' + commands[cmd].description);
    });
}
function reportBug(socket, description) {
    fs.writeFile('bugs/' + Random.uuid() + '.bug', description, (err) => {
        if (err) {
            console.log('Error in writing reported bug!!!');
            console.log('BUG: ' + description);
        }
    });
}

const commands: any = {
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
    'bug': {
        description: 'report a bug with the game <3',
        exec: function (user: User, tok) {
            if (tok.length > 0) {
                reportBug(user.socket, (new Date()).toDateString() + '\n' + (new Date()).toTimeString() + '\n[' + user.name + '](' + user.email + ') reported bug:\n' + tok.join(' '));
                user.socket.emit('chat message', 'Thank you for reporting a bug! It\'s been added to the queue for me to look at when I get a chance!');
            } else {
                user.socket.emit('chat message', 'Please provide a description of the bug you\'ve encountered. usage: /bug <message or description>');
            }
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
            if (user.player) {
                const newName: string = tok.join(' ');
                if (newName.length > 16) {
                    user.socket.emit('chat message', 'That name is too long.');
                } else {
                    const oldName = user.player.name;
                    user.player.name = tok.join(' ');
                    user.socket.broadcast.emit('chat message', oldName + " has changed their name to " + user.player.name);
                    user.socket.emit('chat message', "you have changed your name to " + user.player.name);
                }
            } else {
                user.socket.emit('chat message', "Error: You somehow don't have a player, this is likely a bug.");
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
            if (user.player) {
                if (tok[0] in Instance.directionVectors) {
                    user.player.setAction(new MoveAction(tok[0]));
                } else {
                    user.socket.emit('chat message', 'Invalid move direction: ' + tok[0]);
                }
            } else {
                user.socket.emit('chat message', "Error: You somehow don't have a player, this is likely a bug.");
            }
        },
    },
};

export function execute(user: User, cmd, tok) {
    if (commands[cmd]) {
        commands[cmd].exec(user, tok);
    } else {
        user.socket.emit('chat message', 'command not recognized: /' + cmd + ' try /help or /?');
    }
}
