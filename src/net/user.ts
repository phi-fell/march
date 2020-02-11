import bcrypt = require('bcrypt');
import crypto = require('crypto');
import { promises as fs } from 'fs';
import * as t from 'io-ts';

import { Random } from '../math/random';
import { Player } from '../player';
import { File, OwnedFile } from '../system/file';
import { FileBackedData } from '../system/file_backed_data';
import { Client } from './client';

const TOKEN_LIFESPAN = 1000 * 60 * 60 * 24 * 3; // 3 days in milliseconds

function generateAuthToken() {
    return Random.uuid();
}

async function getHash(pass: string) {
    return bcrypt.hash(pass, 10);
}

async function testPass(pass: string, hash: string) {
    try {
        return bcrypt.compare(pass, hash);
    } catch (err) {
        return false;
    }
}
async function setUsername(id: string, name: string) {
    return fs.writeFile('users/' + name.toLowerCase() + '.id', id + '\n' + name);
}

async function isUsernameUnavailable(username: string): Promise<boolean> {
    return File.exists('users/' + username.toLowerCase() + '.id');
}

interface UserCreationResult {
    success: boolean;
    error?: string;
    token?: string;
}

const UserDataType = t.type({
    'id': t.string,
    'name': t.string,
    'auth': t.type({
        'hash': t.string,
        'token': t.string,
        'token_creation_time': t.number,
    }),
});

export class User extends FileBackedData {
    public static async createUser(client: Client, username: string, passphrase: string): Promise<UserCreationResult> {
        if (await isUsernameUnavailable(username)) {
            const success = false;
            const error = 'Username not available.';
            return { success, error };
        }
        let id = Random.uuid();
        let path = 'users/' + id + '.json';
        while (await File.exists(path)) {
            console.log('Duplicate ID while creating User! UUID collisions should not occur!');
            id = Random.uuid();
            path = 'users/' + id + '.json';
        }
        const hash = getHash(passphrase);
        const file = await File.acquireFile(path);
        const user = new User(file, id);
        setUsername(id, username);
        user._name = username;
        User.users[id] = user;
        const token = user.getFreshAuthToken();
        user.auth.hash = await hash;
        user.save();
        client.attachUser(user);
        await user.unload();
        const success = true;
        return { success, token };
    }
    public static getLoadedUser(id: string): User | undefined {
        return User.users[id];
    }
    /** Remember to unload() loaded users! */
    public static async loadUser(id: string): Promise<User> {
        if (!User.users[id]) {
            const path = 'users/' + id + '.json';
            const file = await File.acquireFile(path);
            User.users[id] = new User(file, id);
        }
        return User.users[id];
    }
    public static async getUserIdFromName(name: string): Promise<string | undefined> {
        try {
            const data = (await File.getReadOnlyFile('users/' + name.toLowerCase() + '.id')).getString();
            const lines = (data + '').split('\n');
            if (name === lines[1]) {// for now we don't allow usernames that only differ by case
                return lines[0];
            }
            return;
        } catch (err) {
            return;
        }
    }
    private static users: { [id: string]: User } = {};

    private client?: Client;
    private _name: string = '';
    private auth: { hash: string; token: string; token_creation_time: number; } = { 'hash': '', 'token': '', 'token_creation_time': 0 };
    private players: Player[] = [];
    private constructor(file: OwnedFile, private id: string) {
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
        const equal = crypto.timingSafeEqual(Buffer.from(token), Buffer.from(this.auth.token));
        return equal && !expired;
    }
    public isLoggedIn(): boolean {
        return this.client !== undefined;
    }
    public login(client: Client, token: string): boolean {
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
        this.unload();
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
        };
    }
    protected async cleanup() {
        delete User.users[this.id];
    }
    protected fromJSON(json: any): void {
        if (UserDataType.is(json)) {
            this.id = json.id;
            this._name = json.name;
            this.auth = json.auth;
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
