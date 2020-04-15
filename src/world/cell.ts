import { Random, UUID } from '../math/random';
import { Board } from './board';
import { FileBackedData } from '../system/file_backed_data';
import type { OwnedFile } from '../system/file';
import * as t from 'io-ts';
import type { World } from './world';
import type { Instance } from './instance';
import type { Locatable } from './locatable';
import type { Entity } from './entity';

export type CellSchema = t.TypeOf<typeof Cell.schema>;

export class Cell extends FileBackedData {
    public static schema = t.type({
        'id': t.string,
        'board': Board.schema,
    });
    public static generateNewID(): UUID {
        return Random.uuid();
    }
    public static async loadCellFromFile(instance: Instance, file: OwnedFile) {
        const cell = new Cell(instance, file);
        await cell.ready();
        return cell;
    }
    private board: Board;
    constructor(public instance: Instance, file: OwnedFile, public id: string = '') {
        super(file);
        this.board = new Board(0, 0);
    }
    public get schema() {
        return Cell.schema;
    }
    getEntity(id: UUID): Entity {
        return this.board.getEntity(id);
    }
    /**
     * Only call this from inside Locatable!
     */
    public removeLocatable(locatable: Locatable) {
        if (locatable.isEntity()) {
            this.board.removeEntity(locatable);
        } else {
            throw new Error('Non-Entity Locatables do not exist?');
        }
    }
    /**
     * Only call this from inside Locatable!
     */
    public addLocatable(locatable: Locatable) {
        if (locatable.isEntity()) {
            this.board.addEntity(locatable);
        } else {
            throw new Error('Non-Entity Locatables do not exist?');
        }
    }
    protected async fromJSON(json: CellSchema): Promise<void> {
        this.id = json.id;
        this.board = await Board.fromJSON(this.instance.world, json.board);
    }
    protected toJSON(): CellSchema {
        return {
            'id': this.id,
            'board': this.board.toJSON(),
        }
    }
}
