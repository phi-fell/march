import * as t from 'io-ts';
import type { Globals } from '../globals';
import { Random, UUID } from '../math/random';
import type { OwnedFile } from '../system/file';
import { FileBackedData } from '../system/file_backed_data';
import { getTileProps, NO_TILE, Tile } from '../tile';
import { Board } from './board';
import type { Entity } from './entity';
import type { Event } from './event';
import { AddEntityEvent } from './event/add_entity_event';
import { RemoveEntityEvent } from './event/remove_entity_event';
import { CellAttributes } from './generation/cellattributes';
import type { CellBlueprint } from './generation/cell_blueprint';
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
    public static async createCell(
        instance: Instance,
        id: UUID,
        file: OwnedFile,
        blueprint: CellBlueprint,
        globals: Globals,
    ): Promise<Cell> {
        const json: CellSchema = {
            id,
            'attributes': blueprint.getAttributes().toJSON(),
            'board': (new Board(0, 0)).toJSON()
        };
        file.setJSON(json);
        const cell = new GeneratableCell(instance, file);
        await cell.ready();
        await blueprint.generateCell(cell, globals);
        return cell;
    }

    private active_players: number = 0;
    protected board: Board = new Board(0, 0);
    public attributes: CellAttributes = new CellAttributes('', 0, 0, 0);
    protected constructor(public instance: Instance, file: OwnedFile, public id: string = '') {
        super(file);
    }
    public get schema() {
        return Cell.schema;
    }
    public addActivePlayer() {
        this.active_players++;
    }
    public removeActivePlayer() {
        this.active_players--;
    }
    public getEntity(id: UUID): Entity {
        return this.board.getEntity(id);
    }
    public async update(): Promise<void> {
        if (this.active_players > 0) {
            await this.board.doNextTurn();
        }
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
    public emitWB(event: Event, whitelist: Location[], blacklist: Location[]) {
        this.board.emitWB(event, whitelist, blacklist);
    }
    public getTileAt(x: number, y: number): Tile {
        return this.board.tiles[x][y];
    }
    public getEntitiesAt(x: number, y: number): Entity[] {
        return this.board.getEntitiesAt(x, y);
    }
    public getAllEntities() {
        return this.board.getAllEntities();
    }
    public getRandomEmptyLocation(rand?: Random): Location {
        let x = 0;
        let y = 0;
        let max_iter = 10000;
        do {
            if (max_iter-- < 0) {
                console.log('ERROR!!! getRandomEmptyLocation() looped too many times!');
                return new Location(-1, -1, this);
            }
            if (rand !== undefined) {
                x = rand.int(0, this.attributes.width);
                y = rand.int(0, this.attributes.height);
            } else {
                x = Random.int(0, this.attributes.width);
                y = Random.int(0, this.attributes.height);
            }
        } while (!getTileProps(this.board.tiles[x][y]).passable || this.board.getEntitiesAt(x, y).length > 0);
        return new Location(x, y, this);
    }
    public getClientEntitiesJSON(viewer: Entity) {
        return this.board.getClientEntitiesJSON(viewer)
    }
    public getClientJSON(viewer: Entity) {
        const visibility_manager = viewer.getComponent('visibility_manager');
        if (!viewer.isActivePlayer() || visibility_manager === undefined) {
            return;
        }
        const retTiles: Tile[][] = [];
        const tileAdjacencies: number[][] = [];
        const MAX_RADIUS = 12;
        const x0 = viewer.location.x - MAX_RADIUS;
        const y0 = viewer.location.y - MAX_RADIUS;
        const x1 = viewer.location.x + MAX_RADIUS;
        const y1 = viewer.location.y + MAX_RADIUS;
        const visible = visibility_manager.getVisibilityMap();
        const player = viewer.getComponent('player');
        const seen_cache = player.getSeenCache(this.instance.id, this.id);
        if (!seen_cache) {
            console.log('BUG! No seen_cache for cell! cannot getClientJSON');
            return;
        }
        if (seen_cache.width !== this.attributes.width || seen_cache.height !== this.attributes.height) {
            console.log('BUG! seen_cache dimension do not match cell dimensions! cannoy getClientJSON');
            return;
        }
        for (let x = x0; x <= x1; x++) {
            retTiles[x - x0] = [];
            tileAdjacencies[x - x0] = [];
            for (let y = y0; y <= y1; y++) {
                if (x < 0 || y < 0 || x >= this.attributes.width || y >= this.attributes.height /*|| (visible !== undefined && !visible[x][y])*/) {
                    retTiles[x - x0][y - y0] = NO_TILE;
                    tileAdjacencies[x - x0][y - y0] = 0;
                } else {
                    retTiles[x - x0][y - y0] = seen_cache.tiles[x][y];
                    let adjacencySum = 0;
                    let multiplier = 1;
                    for (let a = -1; a <= 1; a++) {
                        for (let b = -1; b <= 1; b++) {
                            if (x + a < 0 ||
                                y + b < 0 ||
                                x + a >= this.attributes.width ||
                                y + b >= this.attributes.height ||
                                (seen_cache.tiles[x][y] === this.board.tiles[x + a][y + b])
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
            'fog_of_war': { 'width': this.attributes.width, 'height': this.attributes.height, visible },
        }
    }
    public refreshEntityPlaceInTurnOrder(entity: Entity) {
        this.board.refreshEntityPlaceInTurnOrder(entity);
    }
    /**
     * Only call this from inside Locatable!
     */
    public removeLocatable(locatable: Locatable) {
        if (locatable.isEntity()) {
            if (locatable.isActivePlayer()) {
                this.removeActivePlayer();
            }
            this.emit(new RemoveEntityEvent(locatable), locatable.location);
            this.board.removeEntity(locatable);
        } else {
            throw new Error('Non-Entity Locatables do not exist?');
        }
    }
    /**
     * Only call this from inside Locatable!
     */
    public addLocatable(locatable: Locatable, constructed: boolean = true) {
        if (locatable.isEntity()) {
            this.board.addEntity(locatable, constructed);
            if (constructed) {
                // constructed is set to false when called in the Locatable constructor to account for partially constructed objects
                //      (which do not have components yet and are not valid Entities)
                this.emit(new AddEntityEvent(locatable), locatable.location);
                if (locatable.isActivePlayer()) {
                    this.addActivePlayer();
                }
            }
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
