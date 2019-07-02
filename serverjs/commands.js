(function () {
    var fs = require('fs');
    var io = undefined;
    function execute(game, socket, cmd, tok) {
        switch (cmd) {
            case "admin":
                if (tok.length >= 2) {
                    fs.readFile("admin/" + tok[0], function (err, data) {
                        if (err) throw err;
                        if (data + '' == tok.slice(1).join(' ')) {
                            clientData[socket.id].user.privilege = 'admin';
                            socket.emit('chat message', "Welcome, Admin.")
                        }
                    });
                }
                break;
            case "kick":
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
                break;
            case "name":
                newName = tok.join(' ');
                socket.broadcast.emit('chat message', clientData[socket.id].info.name + " has changed their name to " + newName);
                clientData[socket.id].info.name = newName;
                socket.emit('chat message', "you have changed your name to " + newName)
                game.flushBoard();
                game.updateClient(socket.id);
                break;
            case "whisper":
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
                break;
            case "move":
                if (tok.length < 1) {
                    socket.emit('chat message', "Please enter a direction (up, down, left, right");
                } else {
                    posX = clientData[socket.id].status.x;
                    posY = clientData[socket.id].status.y;
                    nPosX = posX;
                    nPosY = posY;
                    switch (tok[0]) {
                        case "up":
                        case "north":
                            nPosY--;
                            break;
                        case "down":
                        case "south":
                            nPosY++;
                            break;
                        case "left":
                        case "west":
                            nPosX--;
                            break;
                        case "right":
                        case "east":
                            nPosX++;
                            break;
                        default:
                            socket.emit('chat message', 'please pick a valid direction(up, down, left, right, north, south, west, east)');
                            break;
                    }
                    if (nPosX >= 0 && nPosX < game.board.length && nPosY >= 0 && nPosY < game.board[0].length && game.board[nPosX][nPosY] === undefined) {
                        game.board[nPosX][nPosY] = game.board[posX][posY];
                        game.board[posX][posY] = undefined;
                        clientData[socket.id].status.x = nPosX;
                        clientData[socket.id].status.y = nPosY;
                        game.flushBoard();
                        game.updateClient(socket.id);
                    }
                }
                break;
            default:
                socket.emit('chat message', 'command not recognized: /' + cmd)
                break;
        }
    }

    module.exports = function (ioModule) {
        io = ioModule;
        return {
            'execute': execute
        };
    }
}());