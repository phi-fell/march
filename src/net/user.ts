import bcrypt = require('bcrypt');
import crypto = require('crypto');
import * as t from 'io-ts';

import { CharacterSheet } from '../character/charactersheet';
import { Random } from '../math/random';
import { OwnedFile } from '../system/file';
import { FileBackedData } from '../system/file_backed_data';
import { Player } from '../world/player';
import { World } from '../world/world';
import { Client } from './client';

const TOKEN_LIFESPAN = 1000 * 60 * 60 * 24 * 3; // 3 days in milliseconds

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

const UserSchema = t.type({
    'id': t.string,
    'name': t.string,
    'auth': t.type({
        'hash': t.string,
        'token': t.string,
        'token_creation_time': t.number,
    }),
    'unfinished_player': t.any,
    'players': t.array(t.string),
});

export class User extends FileBackedData {
    /** Remember to unload() created users! */
    public static async createUserFromFile(world: World, file: OwnedFile): Promise<User> {
        const user = new User(world, file);
        await user.ready();
        return user;
    }

    public unfinished_player: CharacterSheet = new CharacterSheet();
    public players: Player[] = [];
    private client?: Client;
    private _name: string = '';
    private auth: { hash: string; token: string; token_creation_time: number; } = { 'hash': '', 'token': '', 'token_creation_time': 0 };
    private id: string = '';

    constructor(private world: World, file: OwnedFile) {
        super(file);
    }
    public get name() { return this._name; }
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
            return true;
        }
        return false;
    }
    public logout() {
        this.client = undefined;
    }
    public async finishPlayer() {
        const plr = await this.world.createPlayer(this.unfinished_player.name);
        this.unfinished_player = CharacterSheet.newPlayerSheet();
        this.players.push(plr);
        this.save();
    }
    public toJSON(): t.TypeOf<typeof UserSchema> {
        return {
            'id': this.id,
            'name': this.name,
            'auth': {
                'hash': this.auth.hash,
                'token': this.auth.token,
                'token_creation_time': this.auth.token_creation_time,
            },
            'unfinished_player': this.unfinished_player.toJSON(),
            'players': this.players.map((player: Player) => player.id),
        };
    }
    protected async cleanup() {
        // No Cleanup for now
    }
    protected async fromJSON(json: any): Promise<void> {
        if (UserSchema.is(json)) {
            this.id = json.id;
            this._name = json.name;
            this.auth = json.auth;
            this.unfinished_player = CharacterSheet.fromJSON(json.unfinished_player);
            for (const pid of json.players) {
                const p = await this.world.getPlayer(pid);
                if (p) {
                    this.players.push(p);
                } else {
                    console.log('Error! Player could not be loaded into User!');
                }
            }
        } else {
            console.log('Invalid User JSON!');
        }
    }
    private getFreshAuthToken() {
        this.auth.token_creation_time = Date.now();
        this.auth.token = generateAuthToken();
        this.save();
        return this.auth.token;
    }
}
