import * as t from 'io-ts';
import { Random, UUID } from '../math/random';
import type { OwnedFile } from '../system/file';
import { FileBackedData } from '../system/file_backed_data';
import { getTileProps, NO_TILE, Tile } from '../tile';
import { Board } from './board';
import type { Entity } from './entity';
import type { Event } from './event';
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
    public static async createCell(instance: Instance, id: UUID, file: OwnedFile, attributes: CellAttributes): Promise<Cell> {
        const json: CellSchema = {
            id,
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
    public async update(): Promise<void> {
        this.board.doNextTurn();
    }
    public notifyAsyncEnt(entity_id: UUID) {
        this.board.notifyAsyncEnt(entity_id);
    }
    public emitGlobal(event: Event) {
        this.board.emitGlobal(event);
    }
    public emit(event: Event, ...locations: Location[]) {
        this.board.emit(event, ...locations);
    }
    public getRandomPassableLocation(rand?: Random): Location {
        let x = 0;
        let y = 0;
        let max_iter = 10000;
        do {
            if (max_iter-- < 0) {
                console.log('looped too many times!');
                return new Location(-1, -1, this);
            }
            if (rand) {
                x = rand.int(0, this.attributes.width);
                y = rand.int(0, this.attributes.height);
            } else {
                x = Random.int(0, this.attributes.width);
                y = Random.int(0, this.attributes.height);
            }
        } while (!getTileProps(this.board.tiles[x][y]).passable);
        return new Location(x, y, this);
    }
    public getClientJSON(entity: Entity) {
        const retTiles: Tile[][] = [];
        const tileAdjacencies: number[][] = [];
        const MAX_RADIUS = 10;
        const x0 = entity.location.x - MAX_RADIUS;
        const y0 = entity.location.y - MAX_RADIUS;
        const x1 = entity.location.x + MAX_RADIUS;
        const y1 = entity.location.y + MAX_RADIUS;
        for (let x = x0; x <= x1; x++) {
            retTiles[x - x0] = [];
            tileAdjacencies[x - x0] = [];
            for (let y = y0; y <= y1; y++) {
                if (x < 0 || y < 0 || x >= this.attributes.width || y >= this.attributes.height /* || !entity.canSee(i, j)*/) {
                    retTiles[x - x0][y - y0] = NO_TILE;
                    tileAdjacencies[x - x0][y - y0] = 0;
                } else {
                    retTiles[x - x0][y - y0] = this.board.tiles[x][y];
                    let adjacencySum = 0;
                    let multiplier = 1;
                    for (let a = -1; a <= 1; a++) {
                        for (let b = -1; b <= 1; b++) {
                            if (x + a < 0 ||
                                y + b < 0 ||
                                x + a >= this.attributes.width ||
                                y + b >= this.attributes.height ||
                                (this.board.tiles[x][y] === this.board.tiles[x + a][y + b])
                            ) {
                                adjacencySum += multiplier;
                            }
                            multiplier *= 2;
                        }
                    }
                    tileAdjacencies[x - x0][y - y0] = adjacencySum;
                }
            }
        }
        return {
            'x': x0,
            'y': y0,
            'width': (x1 - x0) + 1,
            'height': (y1 - y0) + 1,
            'tiles': retTiles,
            tileAdjacencies,
            'entities': this.board.getClientEntitiesJSON(),
        }
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
        this.board = Board.fromJSON(this, json.board);
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
