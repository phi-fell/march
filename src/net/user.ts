import bcrypt = require('bcrypt');
import crypto = require('crypto');
import type * as t from 'io-ts';
import { CharacterSheet } from '../character/charactersheet';
import { Random } from '../math/random';
import type { OwnedFile } from '../system/file';
import { FileBackedData } from '../system/file_backed_data';
import type { EventClientJSON } from '../world/event';
import { Player } from '../world/player';
import type { World } from '../world/world';
import type { Client } from './client';
import type { Server } from './server';
import { CurrentUserSchema, updateUserSchema, UserVersionSchema, UserVersionSchemas, USER_FILE_CURRENT_VERSION } from './user_schema_versions';
import { UserSettings } from './user_settings';

const TOKEN_LIFESPAN = 1000 * 60 * 60 * 24 * 3; // 3 days in milliseconds
const MAX_PLAYERS = 5;

function generateAuthToken() {
    return Random.uuid();
}

async function testPass(pass: string, hash: string) {
    try {
        return bcrypt.compare(pass, hash);
    } catch (err) {
        return false;
    }
}

export type UserSchema = t.TypeOf<typeof User.schema>;

export class User extends FileBackedData {
    public static schema = UserVersionSchema;
    /** Remember to unload() created users! */
    public static async createUserFromFile(server: Server, world: World, file: OwnedFile): Promise<User> {
        const user = new User(server, world, file);
        await user.ready();
        return user;
    }

    public unfinished_player = {
        'name': '',
        'sheet': new CharacterSheet()
    };
    public settings: UserSettings = UserSettings.createFreshWithDefaults();
    public players: Player[] = [];
    private activePlayer?: Player;
    private active_player_changing = false;
    private client?: Client;
    private _name: string = '';
    public admin = false;
    private auth: { hash: string; token: string; token_creation_time: number; } = { 'hash': '', 'token': '', 'token_creation_time': 0 };
    private id: string = '';

    protected constructor(public server: Server, private world: World, file: OwnedFile) {
        super(file);
    }
    public get schema() {
        return User.schema;
    }
    public get name() { return this._name; }
    public sendChatMessage(msg: string) {
        this.client?.sendChatMessage(msg);
        // TODO: maybe buffer unsent messages so they still exist when player is logged off?
        // TODO: chat history should maybe be stored server side in general anyway, no?
    }
    public sendEvent(event: EventClientJSON) {
        this.client?.sendEvent(event);
    }
    public sendSettings() {
        this.client?.sendSettings(this.settings.toJSON());
    }
    public getActivePlayer(): Player | undefined {
        if (this.active_player_changing) {
            return;
        }
        if (this.activePlayer) {
            return this.activePlayer;
        }
    }
    public delete_player(index: number) {
        this.players.splice(index, 1);
    }
    public async setActivePlayer(index: number | undefined): Promise<boolean> {
        if (this.active_player_changing) {
            return false;
        }
        if (index === undefined) {
            this.unsetActivePlayer();
            return true;
        }
        if (index < 0 || index >= this.players.length) {
            console.log('could not set active player to index ' + index);
            return false;
        }
        if (this.activePlayer && this.players[index] === this.activePlayer) {
            return true;
        }
        this.unsetActivePlayer();
        this.active_player_changing = true;
        const plr = this.players[index];
        await plr.setActive();
        this.activePlayer = plr;
        this.active_player_changing = false;
        console.log(this.name, 'is now playing as player:', this.activePlayer.name);
        return true;
    }
    protected unsetActivePlayer() {
        if (this.activePlayer) {
            this.activePlayer.setInactive();
            this.activePlayer = undefined;
        }
    }
    public async validateCredentials(username: string, pass: string): Promise<string | undefined> {
        if (username === this.name && await testPass(pass, this.auth.hash)) {
            return this.getFreshAuthToken();
        }
    }
    public validateToken(token: string): boolean {
        const expired = Date.now() - this.auth.token_creation_time > TOKEN_LIFESPAN;
        const buf1 = Buffer.from(token);
        const buf2 = Buffer.from(this.auth.token);
        const equal = (buf1.length === buf2.length) && crypto.timingSafeEqual(buf1, buf2);
        return equal && !expired;
    }
    public isLoggedIn(): boolean {
        return this.client !== undefined;
    }
    public login(client: Client, token: string): boolean {
        if (this.isLoggedIn()) {
            return false;
        }
        if (client.has_attached_user) {
            return false;
        }
        if (this.validateToken(token)) {
            this.client = client;
            client.attachUser(this);
            console.log(this.name, 'logged in');
            return true;
        }
        return false;
    }
    public logout() {
        console.log(this.name, 'logged out');
        this.client = undefined;
    }
    public async finishPlayer(): Promise<{ success: boolean, message: string }> {
        if (this.unfinished_player.name.length < 3) {
            return {
                'success': false,
                'message': 'Name is too short!',
            };
        }
        if (!this.unfinished_player.sheet.race.playable) {
            return {
                'success': false,
                'message': 'Unplayable race selected! (This might be a bug)',
            };
        }
        if (this.players.length >= MAX_PLAYERS) {
            return {
                'success': false,
                'message': 'Maximum number of players reached!',
            };
        }
        const plr = await Player.createPlayer(this, this.world, this.unfinished_player.name, this.unfinished_player.sheet);
        this.unfinished_player = {
            'name': '',
            'sheet': CharacterSheet.newPlayerSheet()
        };
        this.players.push(plr);
        this.save();
        console.log(this.name, 'created a new player named ', plr.name);
        return {
            'success': true,
            'message': '',
        };
    }
    public getGameData() {
        if (!this.activePlayer) {
            console.log('No Active Player!');
            return;
        }
        return this.activePlayer.getGameData();
    }
    public toJSON(): CurrentUserSchema {
        return {
            'version': USER_FILE_CURRENT_VERSION,
            'id': this.id,
            'name': this.name,
            'admin': this.admin,
            'auth': {
                'hash': this.auth.hash,
                'token': this.auth.token,
                'token_creation_time': this.auth.token_creation_time,
            },
            'settings': this.settings.toJSON(),
            'unfinished_player': {
                'name': this.unfinished_player.name,
                'sheet': this.unfinished_player.sheet.toJSON(),
            },
            'players': this.players.map((player: Player) => player.toJSON()),
        };
    }
    protected async fromJSON(json: UserSchema): Promise<void> {
        if (UserVersionSchemas[USER_FILE_CURRENT_VERSION].is(json)) {
            this.id = json.id;
            this._name = json.name;
            this.admin = json.admin;
            this.auth = json.auth;
            this.settings = UserSettings.fromJSON(json.settings);
            this.unfinished_player = {
                'name': json.unfinished_player.name,
                'sheet': CharacterSheet.fromJSON(json.unfinished_player.sheet),
            };
            for (const plr of json.players) {
                this.players.push(await Player.fromJSON(this, this.world, plr));
            }
        } else {
            return this.fromJSON(updateUserSchema(json));
        }
    }
    protected async prepForUnload(): Promise<void> {
        this.activePlayer?.setInactive();
        this.activePlayer = undefined;
    }
    private getFreshAuthToken() {
        this.auth.token_creation_time = Date.now();
        this.auth.token = generateAuthToken();
        this.save();
        return this.auth.token;
    }
}
