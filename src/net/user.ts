import bcrypt = require('bcrypt');
import crypto = require('crypto');
import * as t from 'io-ts';

import { Random } from '../math/random';
import { Player } from '../player';
import { OwnedFile } from '../system/file';
import { FileBackedData } from '../system/file_backed_data';
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

const UserDataType = t.type({
    'id': t.string,
    'name': t.string,
    'auth': t.type({
        'hash': t.string,
        'token': t.string,
        'token_creation_time': t.number,
    }),
    'players': t.array(t.string),
});

export class User extends FileBackedData {
    /** Remember to unload() created users! */
    public static async createUserFromFile(file: OwnedFile): Promise<User> {
        const user = new User(file);
        await user.ready();
        return user;
    }

    private client?: Client;
    private _name: string = '';
    private auth: { hash: string; token: string; token_creation_time: number; } = { 'hash': '', 'token': '', 'token_creation_time': 0 };
    private players: Player[] = [];
    private id: string = '';

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
    public toJSON() {
        return {
            'id': this.id,
            'name': this.name,
            'auth': {
                'hash': this.auth.hash,
                'token': this.auth.token,
                'token_creation_time': this.auth.token_creation_time,
            },
            'players': this.players.forEach((player: Player) => player.toJSON()),
        };
    }
    protected async cleanup() {
        // No Cleanup for now
    }
    protected async fromJSON(json: any): Promise<void> {
        if (UserDataType.is(json)) {
            this.id = json.id;
            this._name = json.name;
            this.auth = json.auth;
            for (const pid of json.players) {
                const p = await Player.loadPlayer(pid);
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
        return this.auth.token;
    }
}
