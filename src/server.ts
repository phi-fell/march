var game = require('./game');
var world = require('./world');
var player = require('./player');
var commands = require('./commands');
var user = require('./user');

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

module.exports.initialize = function (io: any) {
    io!.on('connection', function (socket) {
        console.log('Connection from ' + socket.handshake.address);
        socket.on('disconnect', function () {
            console.log(socket.handshake.address + ' disconnected');
        });
        socket.on('validate', function (msg) {
            user.validateCredentialsByAuthToken(msg.user, msg.auth, function (err, valid) {
                if (err || !valid) {
                    socket.emit('fail');
                    return socket.disconnect();
                } else {
                    socket.emit('success');
                    return socket.disconnect();
                }
            });
        });
        socket.on('authorize', function (msg) {
            user.validateCredentialsByPassAndGetAuthToken(msg.user, msg.pass, function (err, valid, token) {
                if (err || !valid) {
                    socket.emit('fail');
                    return socket.disconnect();
                } else {
                    socket.emit('success', {
                        user: msg.user,
                        auth: token,
                    });
                    return socket.disconnect();
                }
            });
        });
        socket.on('create_user', function (msg) {
            if (msg.user && msg.pass) {
                if (msg.user.length > 32) {
                    socket.emit('fail', { reason: 'Username too long! 32 character maximum' });
                    return socket.disconnect();
                } else if (msg.pass.length > 1024) {
                    socket.emit('fail', { reason: 'Passphrase too long! 1024 character maximum' });
                    return socket.disconnect();
                } else {
                    return user.createNewUser(msg.user, msg.pass, function (err, u) {
                        if (u) {
                            u.getFreshAuthToken(function (err, token) {
                                if (err) {
                                    socket.emit('fail', { reason: 'An error occurred in auth token generation.  Please notify the developer.' });
                                    return socket.disconnect();
                                } else {
                                    socket.emit('success', {
                                        user: msg.user,
                                        auth: token,
                                    });
                                    return socket.disconnect();
                                }
                            });
                            u.unload();
                        } else {
                            socket.emit('fail', { reason: err });
                        }
                    });
                }
            } else {
                socket.emit('fail', { reason: 'Please supply a username and passphrase' });
                return socket.disconnect();
            }
        });
        socket.on('login', function (msg) {
            user.validateCredentialsByAuthToken(msg.user, msg.auth, function (err, valid) {
                if (err || !valid) {
                    socket.emit('fail');
                    return socket.disconnect();
                } else {
                    socket.emit('success');
                    if (user.getLoadedUserByName(msg.user)) {
                        socket.emit('force_disconnect', 'You are already logged in on a different window or device.');
                        socket.disconnect();
                        return;
                    } else {
                        user.loadUserByName(msg.user, function (err, user) {
                            if (err) {
                                console.log(err);
                            }
                            socket.removeAllListeners('validate');
                            socket.removeAllListeners('authorize');
                            socket.removeAllListeners('create_user');
                            socket.removeAllListeners('login');
                            socket.removeAllListeners('disconnect');
                            user.login(socket);
                        });
                    }
                }
            });
        });
    });
}
function oldInitialize(io) {
    io.on('connection', function (socket) {
        console.log('Connection from ' + socket.handshake.address);
        connectUser(socket);
        socket.on('disconnect', function () {
            console.log(socket.handshake.address + ' disconnected');
            removeUser(socket.id);
        });
        //game.flushBoard();
        //game.updateClient(socket.id);
    });
}