import { Entity } from './entity';
import { NO_TILE, Tile } from '../tile';
import * as t from 'io-ts';
import type { World } from './world';
import type { UUID } from '../math/random';

export type BoardSchema = t.TypeOf<typeof Board.schema>

export class Board {
    public static schema = t.type({
        'width': t.number,
        'height': t.number,
        'tiles': t.array(t.array(t.number)),
        'entities': t.array(Entity.schema),
    });

    public static async fromJSON(world: World, json: BoardSchema): Promise<Board> {
        const ret = new Board(json.width, json.height, json.tiles);
        ret.entities = await Promise.all(json.entities.map((ent) => Entity.fromJSON(world, ent)));
        return ret;
    }

    private tiles: Tile[][] = [];
    private entities: Entity[] = [];
    /*
        TODO: ? could be worthwhile to split entities into a map by ID and an array by position, and duplicate data
        (since reads are likely more common than entity movements (and some ents are items or whatnot which do not move))
        I'll wait on this and not prematurely optimize,
        especially without profiling to ensure this is even an area that's executed enough to be worthwhile
    */
    constructor(private width: number, private height: number, t_in?: Tile[][]) {
        if (t_in === undefined) {
            for (let x = 0; x < width; x++) {
                this.tiles[x] = [];
                for (let y = 0; y < height; y++) {
                    this.tiles[x][y] = NO_TILE;
                }
            }
        } else {
            for (let x = 0; x < width; x++) {
                this.tiles[x] = [];
                for (let y = 0; y < height; y++) {
                    this.tiles[x][y] = t_in[x][y];
                }
            }
        }
    }
    public getEntity(id: UUID): Entity {
        const ret = this.entities.find((ent) => ent.id === id);
        if (ret) {
            return ret;
        }
        throw new Error(`No such entity in board as {id:${id}}!`)
    }
    public addEntity(ent: Entity) {
        this.entities.push(ent);
    }
    public removeEntity(ent: Entity) {
        const i = this.entities.findIndex((e) => e.equals(ent));
        if (i === -1) {
            console.log('Cannot remove nonexistent entity from Board!');
        }
        this.entities.splice(i, 1);
    }
    public toJSON(): BoardSchema {
        return {
            'width': this.width,
            'height': this.height,
            'tiles': this.tiles,
            'entities': this.entities.map((ent) => ent.toJSON()),
        }
    }
}
