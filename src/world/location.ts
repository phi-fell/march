import * as t from 'io-ts';
import type { Tile } from '../tile';
import type { Cell } from './cell';
import type { Entity } from './entity';
import { Position } from './position';

export type LocationSchema = t.TypeOf<typeof Location.schema>;

export class Location extends Position {
    public static schema = t.type({
        'instance_id': t.string,
        'cell_id': t.string,
        'x': t.number,
        'y': t.number,
    });

    public static fromJSON(cell: Cell, json: LocationSchema) {
        return new Location(json.x, json.y, cell);
    }
    constructor(x: number, y: number, public readonly cell: Cell) {
        super(x, y);
    }
    get instance_id(): string {
        return this.cell.instance.id;
    }
    get cell_id(): string {
        return this.cell.id;
    }
    public getTileAt(): Tile {
        return this.cell.getTileAt(this.x, this.y);
    }
    public getEntitiesAt(): Entity[] {
        return this.cell.getEntitiesAt(this.x, this.y)
    }
    public translate(dx: number, dy: number): Location {
        return new Location(this.x + dx, this.y + dy, this.cell);
    }
    public withPosition(pos: Position): Location {
        return new Location(pos.x, pos.y, this.cell);
    }
    public equals(rhs: Location) {
        return this.x === rhs.x && this.y === rhs.y && this.cell === rhs.cell;
    }
    public toJSON(): LocationSchema {
        return {
            'instance_id': this.instance_id,
            'cell_id': this.cell_id,
            'x': this.x,
            'y': this.y,
        };
    }
    public getClientJSON(viewer: Entity) {
        return {
            'x': this.x,
            'y': this.y,
        };
    }
}
