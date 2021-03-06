import * as t from 'io-ts';
import type { Socket } from 'socket.io';
import { ATTRIBUTE } from '../character/characterattributes';
import { CharacterRace } from '../character/characterrace';
import { CharacterTrait } from '../character/charactertrait';
import type { EventClientJSON } from '../world/event';
import type { Server } from './server';
import type { User } from './user';
import type { UserSettingsSchema } from './user_settings';

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
                        console.log(socket.handshake.address, 'created a new user account:', msg.user);
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
                        console.log(socket.handshake.address, 'validated as user:', msg.user);
                        socket.emit('success');
                        return socket.disconnect();
                    }
                    console.log('validate failed, invalid token from user:', msg.user);
                } else {
                    console.log('validate from nonexistent username:', msg.user);
                }
            } else {
                console.log('improperly formatted validate:', msg);
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
                            console.log(socket.handshake.address, 'authorized as user:', msg.user);
                            socket.emit('success', {
                                'user': msg.user,
                                'auth': token,
                            });
                            return socket.disconnect();
                        }
                    }
                    console.log('authorize failed for user:', msg.user);
                } else {
                    console.log('authorize from nonexistent username:', msg.user);
                }
            } else {
                console.log('improperly formatted authorize:', msg);
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
                            console.log(socket.handshake.address, 'tried to log in as already logged in user:', msg.user);
                            socket.emit('force_disconnect', 'You are already logged in on a different window or device.');
                            socket.disconnect();
                            return;
                        }
                        if (user.login(client, msg.auth)) {
                            console.log(socket.handshake.address, 'logged in as user:', msg.user);
                            socket.emit('success');
                            socket.removeAllListeners('validate');
                            socket.removeAllListeners('authorize');
                            socket.removeAllListeners('create_user');
                            socket.removeAllListeners('login');
                            client.addLoggedInListeners(socket);
                            return;
                        }
                    }
                    console.log('login failed for user:', msg.user);
                } else {
                    console.log('login from nonexistent username:', msg.user);
                }
            } else {
                console.log('improperly formatted login:', msg);
            }
            socket.emit('fail');
            socket.disconnect();
        });
    }
    public sendChatMessage(msg: string) {
        this.socket.emit('chat', msg);
    }
    public sendEvent(event_json: EventClientJSON) {
        this.socket.emit('event', event_json);
    }
    public sendSettings(settings_json: UserSettingsSchema) {
        this.socket.emit('settings', settings_json);
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
        socket.on('get', (msg) => {
            if (this.user) {
                if (msg === 'players') {
                    this.socket.emit('players', this.user.players.map((p) => p.toJSON()));
                } else if (msg === 'unfinished_player') {
                    this.socket.emit('unfinished_player', {
                        'name': this.user.unfinished_player.name,
                        'sheet': this.user.unfinished_player.sheet.toJSON(),
                    });
                } else if (msg === 'available_races') {
                    this.socket.emit('available_races', CharacterRace.getPlayableRaces());
                } else if (msg === 'available_traits') {
                    this.socket.emit('available_traits', CharacterTrait.getBuyableTraits());
                } else if (msg === 'game_data') {
                    const data = this.user.getGameData();
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
                    const { success, message } = await this.user.finishPlayer();
                    if (success) {
                        socket.emit('character_creation_success');
                    } else {
                        socket.emit('character_creation_fail', message);
                    }
                } else if (msg.action === 'name') {
                    this.user.unfinished_player.name = msg.name;
                } else if (msg.action === 'increment_attribute') {
                    this.user.unfinished_player.sheet.levelUpAttribute(ATTRIBUTE[(msg.attribute as keyof typeof ATTRIBUTE)]);
                } else if (msg.action === 'decrement_attribute') {
                    this.user.unfinished_player.sheet.levelDownAttribute(ATTRIBUTE[(msg.attribute as keyof typeof ATTRIBUTE)]);
                } else if (msg.action === 'race') {
                    const race = msg.race;
                    if (race && CharacterRace.raceExists(race)) {
                        this.user.unfinished_player.sheet.race = new CharacterRace(race);
                    }
                } else if (msg.action === 'add_trait') {
                    const traitID = msg.trait;
                    if (traitID && CharacterTrait.traitExists(traitID)) {
                        const trait = CharacterTrait.get(traitID);
                        this.user.unfinished_player.sheet.addTrait(trait);
                    }
                } else if (msg.action === 'remove_trait') {
                    const traitIndex: unknown = msg.index;
                    if (traitIndex !== undefined && typeof traitIndex === 'number') {
                        this.user.unfinished_player.sheet.removeTrait(traitIndex);
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
        socket.on('delete_player', async (msg: any) => {
            if (this.user) {
                if (typeof msg === 'number') {
                    this.user.delete_player(msg);
                    socket.emit('delete_player_success');
                } else {
                    console.log('Could not delete Players[' + msg + ']!');
                    socket.emit('delete_player_fail', 'Index must be a number!');
                }
            }
        });
        socket.on('chat_message', async (msg: unknown) => {
            if (typeof msg !== 'string') {
                return console.log('non string sent as chat message: ' + msg);
            }
            if (this.user) {
                const plr = this.user.getActivePlayer();
                if (plr) {
                    if (msg.startsWith('/')) {
                        await plr.doCommand(msg.substring(1));
                    } else if (msg.startsWith('#')) {
                        plr.doAction(msg.substring(1));
                    } else if (msg.startsWith('?')) {
                        plr.getQuery(msg.substring(1));
                    } else {
                        plr.doAction(`say ${msg}`);
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
