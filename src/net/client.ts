import * as t from 'io-ts';
import type { Socket } from 'socket.io';
import { ATTRIBUTE } from '../character/characterattributes';
import { CharacterRace } from '../character/characterrace';
import { CharacterTrait } from '../character/charactertrait';
import { getTilePalette } from '../tile';
import type { Event } from '../world/event';
import type { Server } from './server';
import type { User } from './user';

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
    constructor(public readonly server: Server, public id: string, private socket: Socket) {
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
    public sendChatMessage(msg: string) {
        this.socket.emit('chat', msg);
    }
    public sendEvent(event: Event) {
        this.socket.emit('event', event.getClientJSON());
        if (event.resendBoard) {
            if (this.user === undefined) {
                //  Client.sendEvent should only be called by User.sendEvent() on it's client, so tis should not happen.
                console.log('Client.sendEvent() called on client with no attached User! How?');
                return;
            }
            this.socket.emit('update_data', this.user.getGameData());
        }
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
        socket.on('get', async (msg) => {
            if (this.user) {
                if (msg === 'players') {
                    this.socket.emit('players', this.user.players.map((p) => p.toJSON()));
                } else if (msg === 'unfinished_player') {
                    this.socket.emit('unfinished_player', this.user.unfinished_player.toJSON());
                } else if (msg === 'available_races') {
                    this.socket.emit('available_races', CharacterRace.getPlayableRaces());
                } else if (msg === 'available_traits') {
                    this.socket.emit('available_traits', CharacterTrait.getBuyableTraits());
                } else if (msg === 'palette') {
                    this.socket.emit('palette', getTilePalette());
                } else if (msg === 'game_data') {
                    const data = await this.user.getGameData();
                    if (data) {
                        this.socket.emit('game_data', data);
                    } else {
                        this.socket.emit('game_data_fail');
                    }
                }
            }
        });
        socket.on('character_creation', async (msg: any) => {
            if (this.user) {
                if (msg.action === 'finish') {
                    this.user.finishPlayer();
                } else if (msg.action === 'name') {
                    this.user.unfinished_player.name = msg.name;
                } else if (msg.action === 'increment_attribute') {
                    this.user.unfinished_player.levelUpAttribute(ATTRIBUTE[(msg.attribute as keyof typeof ATTRIBUTE)]);
                } else if (msg.action === 'decrement_attribute') {
                    this.user.unfinished_player.levelDownAttribute(ATTRIBUTE[(msg.attribute as keyof typeof ATTRIBUTE)]);
                } else if (msg.action === 'race') {
                    const race = msg.race;
                    if (race && CharacterRace.raceExists(race)) {
                        this.user.unfinished_player.race = new CharacterRace(race);
                    }
                } else if (msg.action === 'add_trait') {
                    const traitID = msg.trait;
                    if (traitID && CharacterTrait.traitExists(traitID)) {
                        const trait = CharacterTrait.get(traitID);
                        this.user.unfinished_player.addTrait(trait);
                    }
                } else if (msg.action === 'remove_trait') {
                    const traitIndex: unknown = msg.index;
                    if (traitIndex !== undefined && typeof traitIndex === 'number') {
                        this.user.unfinished_player.removeTrait(traitIndex);
                    }
                }
            }
        });
        socket.on('set_active_player', async (msg: any) => {
            if (this.user) {
                if (typeof msg === 'number') {
                    const success: boolean = await this.user.setActivePlayer(msg);
                    socket.emit('active_player_response', {
                        'success': success,
                        'msg': success ? undefined : 'Could not set active player!',
                    });
                } else {
                    console.log('Could not set active player to Players[' + msg + ']!');
                    socket.emit('active_player_response', {
                        'success': false,
                        'msg': 'Index must be a number!',
                    });
                }
            }
        });
        socket.on('chat_message', (msg: string) => {
            if (this.user) {
                const plr = this.user.getActivePlayer();
                if (plr) {
                    if (msg.startsWith('/')) {
                        plr.doCommand(msg.substring(1));
                    } else if (msg.startsWith('#')) {
                        plr.doAction(msg.substring(1));
                    } else if (msg.startsWith('?')) {
                        plr.getQuery(msg.substring(1));
                    } else {
                        plr.sayChatMessageAsEntity(msg);
                    }
                } else {
                    console.log(`User [${this.user.name}] without active Player sent: ${msg}`);
                }
            } else {
                console.log(`Client without User sent: ${msg}`);
            }
        });
    }
}
