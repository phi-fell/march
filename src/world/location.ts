import * as t from 'io-ts';
import { Position } from './position';
import type { UUID } from '../math/random';

export type LocationSchema = t.TypeOf<typeof Location.schema>;

export class Location extends Position {
    public static schema = t.type({
        'instance_id': t.string,
        'cell_id': t.string,
        'x': t.number,
        'y': t.number,
    });

    public static fromJSON(json: LocationSchema) {
        return new Location(json.x, json.y, json.instance_id, json.cell_id);
    }
    constructor(x: number, y: number, private _instance_id: UUID, private _cell_id: UUID) {
        super(x, y);
    }
    get instance_id(): string {
        return this._instance_id;
    }
    get cell_id(): string {
        return this._cell_id;
    }
    public translate(dx: number, dy: number) {
        return new Location(this.x + dx, this.y + dy, this._instance_id, this._cell_id);
    }
    public equals(rhs: Location) {
        return this.x === rhs.x && this.y === rhs.y && this._instance_id === rhs._instance_id && this._cell_id === rhs._cell_id;
    }
    public clone() {
        return new Location(this.x, this.y, this._instance_id, this._cell_id);
    }
    public toJSON(): LocationSchema {
        return {
            'instance_id': this._instance_id,
            'cell_id': this._cell_id,
            'x': this.x,
            'y': this.y,
        };
    }
}
