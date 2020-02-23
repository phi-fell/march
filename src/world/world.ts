import { Random } from '../math/random';
import { File } from '../system/file';
import { Player } from './player';

export class World {
    private players: { [id: string]: Player; } = {};

    public unload() {
        Object.values(this.players).forEach((player: Player) => {
            player.unload();
        });
        this.players = {};
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
