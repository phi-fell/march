import * as t from 'io-ts';
import { Random, UUID } from '../math/random';
import type { OwnedFile } from '../system/file';
import { FileBackedData } from '../system/file_backed_data';
import { getTileProps } from '../tile';
import { Board } from './board';
import type { Entity } from './entity';
import { CellAttributes } from './generation/cellattributes';
import { CellGeneration } from './generation/cellgeneration';
import type { Instance } from './instance';
import type { Locatable } from './locatable';
import { Location } from './location';

export type CellSchema = t.TypeOf<typeof Cell.schema>;

export class Cell extends FileBackedData {
    public static schema = t.type({
        'id': t.string,
        'attributes': CellAttributes.schema,
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
    public static async createCell(instance: Instance, file: OwnedFile, attributes: CellAttributes): Promise<Cell> {
        const json: CellSchema = {
            'id': Cell.generateNewID(),
            'attributes': attributes.toJSON(),
            'board': (new Board(0, 0)).toJSON()
        };
        file.setJSON(json);
        const cell = new GeneratableCell(instance, file);
        await cell.ready();
        CellGeneration.generateCell(cell);
        return cell;
    }

    protected board: Board = new Board(0, 0);
    public attributes: CellAttributes = new CellAttributes('', 0, 0, 0);
    protected constructor(public instance: Instance, file: OwnedFile, public id: string = '') {
        super(file);
    }
    public get schema() {
        return Cell.schema;
    }
    public getEntity(id: UUID): Entity {
        return this.board.getEntity(id);
    }
    public getRandomPassableLocation(rand?: Random): Location {
        let x = 0;
        let y = 0;
        let max_iter = 10000;
        do {
            if (max_iter-- < 0) {
                console.log('looped too many times!');
                return new Location(-1, -1, this.instance.id, this.id);
            }
            if (rand) {
                x = rand.int(0, this.attributes.width);
                y = rand.int(0, this.attributes.height);
            } else {
                x = Random.int(0, this.attributes.width);
                y = Random.int(0, this.attributes.height);
            }
        } while (!getTileProps(this.board.tiles[x][y]).passable);
        return new Location(x, y, this.instance.id, this.id);
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
        this.attributes = CellAttributes.fromJSON(json.attributes);
        this.board = await Board.fromJSON(this.instance.world, json.board);
    }
    protected toJSON(): CellSchema {
        return {
            'id': this.id,
            'attributes': this.attributes.toJSON(),
            'board': this.board.toJSON(),
        }
    }
}

export class GeneratableCell extends Cell {
    public getBoard(): Board {
        return this.board;
    }
    public setBoard(board: Board) {
        this.board = board;
    }
}