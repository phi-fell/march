import * as t from 'io-ts';
import { Socket } from 'socket.io';

import { ATTRIBUTE } from '../character/characterattributes';
import { CharacterRace } from '../character/characterrace';
import { CharacterTrait } from '../character/charactertrait';
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

const usernameCharRegex = /^[a-zA-Z0-9_\- ]+$/;
const usernameStartRegex = /^[a-zA-Z0-9]+/;
const usernameEndRegex = /[a-zA-Z0-9]+$/;
const minUsernameLength = 3;
const maxUsernameLength = 32;
const minPassLength = 3;
const maxPassLength = 72;

const UserAuthDataType = t.type({
    'user': t.string,
    'auth': t.string,
});

const CredentialsDataType = t.type({
    'user': t.string,
    'pass': t.string,
});

export class Client {
    private connection_state_inner: CLIENT_CONNECTION_STATE = CLIENT_CONNECTION_STATE.DISCONNECTED;
    private user?: User;
    public get connection_state() {
        return this.connection_state_inner;
    }
    public get has_attached_user(): boolean {
        return this.user !== undefined;
    }
    constructor(private server: Server, public id: string, private socket: Socket) {
        this.connection_state_inner = CLIENT_CONNECTION_STATE.CONNECTED;
        socket.on('disconnect', () => this.disconnect());
        console.log('Connection from ' + socket.handshake.address);
        const client = this;
        socket.on('create_user', async (msg) => {
            if (msg.user && msg.pass) {
                if (msg.user.length < minUsernameLength) {
                    socket.emit('fail', { 'reason': 'Username too short! ' + minUsernameLength + ' character minimum' });
                    return socket.disconnect();
                }
                if (msg.user.length > maxUsernameLength) {
                    socket.emit('fail', { 'reason': 'Username too long! ' + maxUsernameLength + ' character maximum' });
                    return socket.disconnect();
                }
                if (msg.pass.length < minPassLength) {
                    socket.emit('fail', { 'reason': 'Passphrase too short! ' + minPassLength + ' character minimum' });
                    return socket.disconnect();
                }
                if (msg.pass.length > maxPassLength) {
                    socket.emit('fail', { 'reason': 'Passphrase too long! ' + maxPassLength + ' character maximum' });
                    return socket.disconnect();
                }
                if (!usernameCharRegex.test(msg.user)) {
                    socket.emit('fail', { 'reason': 'Username must only contain underscores, dashes, spaces and alphanumerics' });
                    return socket.disconnect();
                }
                if (!usernameStartRegex.test(msg.user)) {
                    socket.emit('fail', { 'reason': 'Username must start with an alphanumeric' });
                    return socket.disconnect();
                }
                if (!usernameEndRegex.test(msg.user)) {
                    socket.emit('fail', { 'reason': 'Username must end with an alphanumeric' });
                    return socket.disconnect();
                }
                try {
                    const { success, error, token } = await client.server.createUser(msg.user, msg.pass);
                    if (success) {
                        socket.emit('success', {
                            'user': msg.user,
                            'auth': token,
                        });
                        return socket.disconnect();
                    }
                    socket.emit('fail', { 'reason': error });
                    return socket.disconnect();
                } catch (err) {
                    console.log(err);
                    socket.emit('fail', { 'reason': 'An Unknown error occurred!' });
                    return socket.disconnect();
                }
            }
            socket.emit('fail', { 'reason': 'Please supply a username and passphrase' });
            return socket.disconnect();
        });
        socket.on('validate', async (msg) => {
            if (UserAuthDataType.is(msg)) {
                const user_id = await client.server.getUserIdFromName(msg.user);
                if (user_id) {
                    const user = await client.server.getUser(user_id);
                    if (user && user.validateToken(msg.auth)) {
                        socket.emit('success');
                        return socket.disconnect();
                    }
                }
            }
            socket.emit('fail');
            socket.disconnect();
        });
        socket.on('authorize', async (msg) => {
            if (CredentialsDataType.is(msg)) {
                const user_id = await client.server.getUserIdFromName(msg.user);
                if (user_id) {
                    const user = await client.server.getUser(user_id);
                    if (user) {
                        const token = await user.validateCredentials(msg.user, msg.pass);
                        if (token) {
                            socket.emit('success', {
                                'user': msg.user,
                                'auth': token,
                            });
                            return socket.disconnect();
                        }
                    }
                }
            }
            socket.emit('fail');
            socket.disconnect();
        });
        socket.on('login', async (msg) => {
            if (UserAuthDataType.is(msg)) {
                const user_id = await client.server.getUserIdFromName(msg.user);
                if (user_id) {
                    const user = await client.server.getUser(user_id);
                    if (user) {
                        if (user.isLoggedIn()) {
                            socket.emit('force_disconnect', 'You are already logged in on a different window or device.');
                            socket.disconnect();
                            return;
                        }
                        if (user.login(client, msg.auth)) {
                            socket.emit('success');
                            socket.removeAllListeners('validate');
                            socket.removeAllListeners('authorize');
                            socket.removeAllListeners('create_user');
                            socket.removeAllListeners('login');
                            client.addLoggedInListeners(socket);
                            return;
                        }
                    }
                }
            }
            socket.emit('fail');
            socket.disconnect();
        });
    }
    public attachUser(user: User) {
        this.user = user;
    }
    public disconnect() {
        this.user?.logout();
        this.user = undefined;
        if (this.connection_state === CLIENT_CONNECTION_STATE.CONNECTED) {
            this.connection_state_inner = CLIENT_CONNECTION_STATE.DISCONNECTED;
            this.server.removeClient(this.id);
            this.socket.disconnect();
            console.log(this.socket.handshake.address + ' disconnected');
        }
    }
    private addLoggedInListeners(socket: Socket) {
        const client = this;
        socket.on('get', async (msg) => {
            if (client.user) {
                if (msg === 'players') {
                    client.socket.emit('players', client.user.players.map((p) => p.toJSON()));
                } else if (msg === 'unfinished_player') {
                    client.socket.emit('unfinished_player', client.user.unfinished_player.toJSON());
                } else if (msg === 'available_races') {
                    client.socket.emit('available_races', CharacterRace.getPlayableRaces());
                } else if (msg === 'available_traits') {
                    client.socket.emit('available_traits', [CharacterTrait.getTraitList()]);
                }
            }
        });
        socket.on('character_creation', async (msg: any) => {
            if (client.user) {
                if (msg.action === 'finish') {
                    client.user.finishPlayer();
                } else if (msg.action === 'name') {
                    client.user.unfinished_player.name = msg.name;
                } else if (msg.action === 'increment_attribute') {
                    client.user.unfinished_player.levelUpAttribute(ATTRIBUTE[(msg.attribute as keyof typeof ATTRIBUTE)]);
                } else if (msg.action === 'decrement_attribute') {
                    client.user.unfinished_player.levelDownAttribute(ATTRIBUTE[(msg.attribute as keyof typeof ATTRIBUTE)]);
                }
            }
        });
    }
}
