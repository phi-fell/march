import bcrypt = require('bcrypt');
import { promises as fs } from 'fs';
import { Socket } from 'socket.io';

import { Random } from '../math/random';
import { File } from '../system/file';
import { Player } from '../world/player';
import { Client, CLIENT_CONNECTION_STATE } from './client';
import { User } from './user';

async function getHash(pass: string) {
    return bcrypt.hash(pass, 10);
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

export class Server {
    private running: boolean = true;
    private clients: { [id: string]: Client; } = {};
    private users: { [id: string]: User; } = {};
    private players: { [id: string]: Player; } = {};
    constructor(private _server: SocketIO.Server) {
        _server.on('connection', (socket: Socket) => {
            if (this.running) {
                this.clients[socket.id] = new Client(this, socket.id, socket);
            }
        });
    }
    public get server() {
        return this._server;
    }
    public async shutdown() {
        this.running = false;
        Object.values(this.clients).forEach((client: Client) => {
            client.disconnect();
        });
        this.clients = {};
        Object.values(this.users).forEach((user: User) => {
            user.unload();
        });
        this.users = {};
        Object.values(this.players).forEach((player: Player) => {
            player.unload();
        });
        this.players = {};
    }
    public removeClient(id: string) {
        if (this.clients[id]) {
            if (this.clients[id].connection_state === CLIENT_CONNECTION_STATE.CONNECTED) {
                console.log('Error: Cannot remove connected Client!');
            } else {
                delete this.clients[id];
            }
        } else {
            console.log('Error: Cannot remove nonexistent Client!');
        }
    }
    public getClient(id: string): Client | null {
        return this.clients[id] || null;
    }
    public getLoadedUser(id: string): User | undefined {
        return this.users[id];
    }
    public async getUser(id: string): Promise<User | undefined> {
        if (!this.users[id]) {
            const path = 'users/' + id + '.json';
            const file = await File.acquireFile(path);
            this.users[id] = await User.createUserFromFile(file);
        }
        return this.users[id];
    }
    public async getUserIdFromName(name: string): Promise<string | undefined> {
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
    public async createUser(username: string, passphrase: string): Promise<UserCreationResult> {
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
        const file = await File.acquireFile(path);
        const hash = getHash(passphrase);
        file.setJSON({
            'id': id,
            'name': username,
            'auth': {
                'hash': await hash,
                'token': '',
                'token_creation_time': 0,

            },
            'players': [],
        });
        const user = await User.createUserFromFile(file);
        this.users[id] = user;
        user.save();
        await setUsername(id, username);
        const token = await user.validateCredentials(username, passphrase);
        const success = true;
        return { success, token };
    }
    public getLoadedPlayer(id: string): Player | undefined {
        return this.players[id];
    }
    public async getPlayer(id: string): Promise<Player | undefined> {
        if (!this.players[id]) {
            const path = 'players/' + id + '.json';
            const file = await File.acquireFile(path);
            this.players[id] = await Player.createPlayerFromFile(file);
        }
        return this.players[id];
    }
    public async getPlayerIdFromName(name: string): Promise<string | undefined> {
        try {
            const data = (await File.getReadOnlyFile('players/' + name.toLowerCase() + '.id')).getString();
            const lines = (data + '').split('\n');
            if (name === lines[1]) {// for now we don't allow playernames that only differ by case
                return lines[0];
            }
            return;
        } catch (err) {
            return;
        }
    }
    public async createPlayer(name: string): Promise<Player> {
        let id = Random.uuid();
        let path = 'players/' + id + '.json';
        while (await File.exists(path)) {
            console.log('Duplicate ID while creating Player! UUID collisions should not occur!');
            id = Random.uuid();
            path = 'players/' + id + '.json';
        }
        const file = await File.acquireFile(path);
        file.setJSON({
            id,
            name,
        });
        const player = await Player.createPlayerFromFile(file);
        this.players[id] = player;
        player.save();
        return player;
    }
}
