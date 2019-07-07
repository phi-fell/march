var game = require('./game');
var world = require('./world');
var player = require('./player');
var auth = require('./auth');
var commands = require('./commands');

var io = undefined;

var users = {}
function connectUser(socket) {
    users[socket.id] = {
        'socketId': socket.id,
        'socket': socket,
        'privilege': 'none',
    }
}
function removeUser(socket) {
    delete users[socket.id];
}
function accessUser(sockId) {
    return users[sockId];
}
module.exports.accessUserFromSocketId = accessUser;

function giveSocketBasicPrivileges(socket) {
    socket.removeAllListeners('disconnect');
    socket.on('disconnect', function () {
        console.log(socket.handshake.address + ' disconnected');
        //game.removeClientData(socket.id);
        var plr = player.accessPlayer(accessUser(socket.id).playerId);
        io.emit('chat message', plr.name + ' disconnected');
        //TODO DISCONNECT PLAYER
        world.removeEntityFromWorld(plr);
        player.deletePlayerById(plr.id);
        removeUser(socket.id);
    });
    socket.on('ping_cmd', function (msg) {
        console.log('ping from ' + player.accessPlayer(accessUser(socket.id).playerId).name);
        socket.emit('pong_cmd', msg);
    });
    socket.on('chat message', function (msg) {
        console.log(player.accessPlayer(accessUser(socket.id).playerId).name + "> " + msg);
        io.emit('chat message', player.accessPlayer(accessUser(socket.id).playerId).name + "> " + msg);
    });
    socket.on('command', function (msg) {
        var plr_id = accessUser(socket.id).playerId;
        console.log(player.accessPlayer(plr_id).name + " requests command /" + msg.cmd + " with arguments [" + msg.tok.join(' ') + "]")
        commands.execute(game, socket, msg.cmd, msg.tok);
        socket.emit('board', world.getPlayerBoard(plr_id));
        socket.emit('player', world.getPlayerData(plr_id));
    });
    socket.on("player_action", function (msg) {
        let plr = player.accessPlayer(accessUser(socket.id).playerId);
        switch (msg + '') {
            case "move_up":
                plr.move('up');
                break;
            case "move_left":
                plr.move('left')
                break;
            case "move_down":
                plr.move('down')
                break;
            case "move_right":
                plr.move('right')
                break;
            default:
                socket.emit('log', 'unknown action: ' + msg)
                break;
        }
        socket.emit('board', world.getPlayerBoard(plr.id));
        socket.emit('player', world.getPlayerData(plr.id));
    });
}

module.exports.initialize = function (ioModule) {
    io = ioModule;
    io.on('connection', function (socket) {
        console.log('Connection from ' + socket.handshake.address);
        connectUser(socket);
        socket.on('disconnect', function () {
            console.log(socket.handshake.address + ' disconnected');
            removeUser(socket.id);
        });
        socket.on('new_user', function (msg) {
            var plr = player.createPlayer();
            accessUser(socket.id).playerId = plr.id;
            var creds = {}
            creds.user = plr.name;
            creds.pass = auth.createUserAndGetPass(plr.id);
            auth.setUserIdByName(plr.id, plr.name)
            socket.emit('cache_credentials', creds);
            socket.emit('chat message', "Welcome to the server, you have been assigned the designation '" + player.accessPlayer(accessUser(socket.id).playerId).name + "'");
            socket.emit('chat message', "change your name with /name and set a passphrase with /pass credentials are by default stored for 3 days (/rememberme)");
            socket.emit('chat message', "Please be aware that during developement, free users will be deleted on every major release, some minor releases, or after 7 days of no activity - whichever comes first");
            socket.emit('chat message', "For notifications about developement and to be given priority access to features and possibly a longer delay before account purging, use /email");
            giveSocketBasicPrivileges(socket);
            socket.emit('board', world.getPlayerBoard(plr.id));
            socket.emit('player', world.getPlayerData(plr.id));
            socket.broadcast.emit('chat message', player.accessPlayer(accessUser(socket.id).playerId).name + ' connected')
        });
        socket.on('login', function (msg) {
            auth.getUserIdFromName(msg.user, function (err, id) {
                if (err) {
                    socket.emit('force_disconnect', 'No such user found! Try clearing your local cache with /clearcredentials (then refresh the page)');
                    socket.disconnect();
                    return;
                } else {
                    if (player.accessPlayer(id)) {
                        socket.emit('force_disconnect', 'You are already logged in on a different window or device.');
                        socket.disconnect();
                        return;
                    } else {
                        return auth.validateUserById(id, msg.pass, function (err, res) {
                            if (res) {
                                accessUser(socket.id).playerId = id;
                                player.loadPlayer(id, msg.user);//TODO: log in player (load from file or whatnot)
                                let plr = player.accessPlayer(id)
                                socket.emit('chat message', "Welcome, " + plr.name + "!");
                                socket.emit('chat message', "Please be aware that during developement, free users will be deleted on every major release, some minor releases, or after 7 days of no activity - whichever comes first");
                                socket.emit('chat message', "For notifications about developement and to be given priority access to features and possibly a longer delay before account purging, use /email");
                                giveSocketBasicPrivileges(socket);
                                socket.emit('board', world.getPlayerBoard(plr.id));
                                socket.emit('player', world.getPlayerData(plr.id));
                                socket.broadcast.emit('chat message', plr.name + ' connected');
                            } else {
                                console.log('invalid credentials');
                                socket.emit('chat message', 'Invalid credentials!');
                            }
                        });
                    }
                }
            });
        });
        //game.flushBoard();
        //game.updateClient(socket.id);
    });
}