import { Instance } from './instance';
import { createNewUser, getLoadedUserByName, loadUserByName, validateCredentialsByAuthToken, validateCredentialsByPassAndGetAuthToken } from './user';

export class Server {
    public static updateLoop() {
        Instance.updateAll();
        setTimeout(Server.updateLoop, 200);
    }
    public static initialize(io: any) {
        io!.on('connection', (socket) => {
            console.log('Connection from ' + socket.handshake.address);
            socket.on('disconnect', () => {
                console.log(socket.handshake.address + ' disconnected');
            });
            socket.on('validate', (msg) => {
                validateCredentialsByAuthToken(msg.user, msg.auth, (err, valid) => {
                    if (err || !valid) {
                        socket.emit('fail');
                        return socket.disconnect();
                    }
                    socket.emit('success');
                    return socket.disconnect();
                });
            });
            socket.on('authorize', (msg) => {
                validateCredentialsByPassAndGetAuthToken(msg.user, msg.pass, (err, valid, token) => {
                    if (err || !valid) {
                        socket.emit('fail');
                        return socket.disconnect();
                    }
                    socket.emit('success', {
                        'user': msg.user,
                        'auth': token,
                    });
                    return socket.disconnect();
                });
            });
            socket.on('create_user', (msg) => {
                if (msg.user && msg.pass) {
                    if (msg.user.length > 32) {
                        socket.emit('fail', { 'reason': 'Username too long! 32 character maximum' });
                        return socket.disconnect();
                    }
                    if (msg.pass.length > 1024) {
                        socket.emit('fail', { 'reason': 'Passphrase too long! 1024 character maximum' });
                        return socket.disconnect();
                    }
                    return createNewUser(msg.user, msg.pass, (create_err, u) => {
                        if (u) {
                            u.getFreshAuthToken((token_err, token) => {
                                if (token_err) {
                                    socket.emit('fail', { 'reason': 'An error occurred in auth token generation.  Please notify the developer.' });
                                    return socket.disconnect();
                                }
                                socket.emit('success', {
                                    'user': msg.user,
                                    'auth': token,
                                });
                                return socket.disconnect();
                            });
                            u.unload();
                        } else {
                            socket.emit('fail', { 'reason': create_err });
                        }
                    });
                }
                socket.emit('fail', { 'reason': 'Please supply a username and passphrase' });
                return socket.disconnect();
            });
            socket.on('login', (msg) => {
                validateCredentialsByAuthToken(msg.user, msg.auth, (validate_err, valid) => {
                    if (validate_err || !valid) {
                        socket.emit('fail');
                        return socket.disconnect();
                    }
                    socket.emit('success');
                    if (getLoadedUserByName(msg.user)) {
                        socket.emit('force_disconnect', 'You are already logged in on a different window or device.');
                        socket.disconnect();
                        return;
                    }
                    loadUserByName(msg.user, (load_err, user) => {
                        if (load_err) {
                            console.log(load_err);
                        }
                        socket.removeAllListeners('validate');
                        socket.removeAllListeners('authorize');
                        socket.removeAllListeners('create_user');
                        socket.removeAllListeners('login');
                        socket.removeAllListeners('disconnect');
                        user.login(socket);
                    });
                });
            });
        });
    }
}
