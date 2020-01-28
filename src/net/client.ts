import { Socket } from 'socket.io';

import { Server } from './server';
import { User } from './user';

export enum CLIENT_CONNECTION_STATE {
    CONNECTED,
    DISCONNECTED,
}

export enum CLIENT_AUTHENTICATION_STATE {
    UNAUTHENTICATED,
    PROCESSING,
    AUTHENTICATED,
    INVALID,
}

export class Client {
    private connection_state_inner: CLIENT_CONNECTION_STATE = CLIENT_CONNECTION_STATE.DISCONNECTED;
    private user: User | null = null;
    public get connection_state() {
        return this.connection_state_inner;
    }
    public get has_connected_user(): boolean {
        return this.user !== null;
    }
    constructor(private server: Server, public id: string, private socket: Socket) {
        this.connection_state_inner = CLIENT_CONNECTION_STATE.CONNECTED;
        socket.on('disconnect', () => this.disconnect());
        console.log('Connection from ' + socket.handshake.address);
        /*
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
        });*/
    }
    public disconnect() {
        if (this.connection_state === CLIENT_CONNECTION_STATE.CONNECTED) {
            this.connection_state_inner = CLIENT_CONNECTION_STATE.DISCONNECTED;
            this.server.removeClient(this.id);
            this.socket.disconnect();
            console.log(this.socket.handshake.address + ' disconnected');
        }
    }
}
