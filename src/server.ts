import type { Socket } from 'socket.io';

import { Instance } from './old_instance';
import {
    createNewUser,
    getLoadedUserByName,
    loadUserByName,
    User,
    validateCredentialsByAuthToken,
    validateCredentialsByPassAndGetAuthToken,
} from './user';

export class Server {
    public static updateLoop() {
        Instance.updateAll();
        setTimeout(Server.updateLoop, 200);
    }
    public static initialize(io: any) {
        io!.on('connection', (socket: Socket) => {
            console.log('Connection from ' + socket.handshake.address);
            socket.on('disconnect', () => {
                console.log(socket.handshake.address + ' disconnected');
            });
            socket.on('validate', (msg) => {
                validateCredentialsByAuthToken(msg.user, msg.auth, (err: any, valid: any) => {
                    if (err || !valid) {
                        socket.emit('fail');
                        return socket.disconnect();
                    }
                    socket.emit('success');
                    return socket.disconnect();
                });
            });
            socket.on('authorize', (msg) => {
                validateCredentialsByPassAndGetAuthToken(msg.user, msg.pass, (err: any, valid: any, token: any) => {
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
                    return createNewUser(msg.user, msg.pass, (create_err: any, u: User) => {
                        if (u) {
                            u.getFreshAuthToken((token_err: any, token: any) => {
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
                validateCredentialsByAuthToken(msg.user, msg.auth, (validate_err: any, valid: any) => {
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
                    loadUserByName(msg.user, (load_err: any, user: User) => {
                        if (load_err) {
                            console.log(load_err);
                        }
                        socket.removeAllListeners('validate');
                        socket.removeAllListeners('authorize');
                        socket.removeAllListeners('create_user');
                        socket.removeAllListeners('login');
                        user.login(socket);
                    });
                });
            });
        });
    }
}
