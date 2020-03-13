import { OwnedFile } from '../system/file';
import { FileBackedData } from '../system/file_backed_data';

export class Player extends FileBackedData {
    /** Remember to unload() created users! */
    public static async createPlayerFromFile(file: OwnedFile): Promise<Player> {
        let player;
        player = new Player(file);
        await player.ready();
        return player;
    }

    protected _id: string = '';
    protected name: string = '';
    public get id() {
        return this._id;
    }
    public toJSON() {
        return {
            'id': this.id,
            'name': this.name,
        };
    }
    protected async fromJSON(json: any): Promise<void> {
        this._id = json.id;
        this.name = json.name;
    }
    protected async cleanup(): Promise<void> {
        // nothing to do here
    }
}
