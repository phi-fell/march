import * as t from 'io-ts';

import { OwnedFile } from '../system/file';
import { FileBackedData } from '../system/file_backed_data';

const PlayerDataType = t.type({
    'id': t.string,
    'name': t.string,
});

export class Player extends FileBackedData {
    /** Remember to unload() created users! */
    public static async createPlayerFromFile(file: OwnedFile): Promise<Player> {
        const player = new Player(file);
        await player.ready();
        return player;
    }

    private _id: string = '';
    private name: string = '';
    public get id() {
        return this._id;
    }
    public toJSON() {
        return {
            'id': this._id,
            'name': this.name,
        };
    }
    protected async fromJSON(json: any): Promise<void> {
        if (PlayerDataType.is(json)) {
            this._id = json.id;
            this.name = json.name;
        } else {
            console.log('Invalid Player JSON!');
        }
    }
    protected async cleanup(): Promise<void> {
        // nothing to do here
    }
}
