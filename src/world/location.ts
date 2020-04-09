import * as t from 'io-ts';
import { Position } from './position';

export type LocationSchema = t.TypeOf<typeof Location.schema>;

export class Location extends Position {
    public static schema: t.Any = t.type({
        'instance_id': t.string,
        'x': t.number,
        'y': t.number,
    });

    public static fromJSON(json: LocationSchema) {
        return new Location(json.x, json.y, json.instance_id);
    }
    constructor(x: number, y: number, private _instance_id: string) {
        super(x, y);
    }
    get instance_id(): string {
        return this._instance_id;
    }
    public translate(dx: number, dy: number) {
        return new Location(this.x + dx, this.y + dy, this.instance_id);
    }
    public equals(rhs: Location) {
        return this.x === rhs.x && this.y === rhs.y && this.instance_id === rhs.instance_id;
    }
    public clone() {
        return new Location(this.x, this.y, this.instance_id);
    }
    public toJSON(): LocationSchema {
        return {
            'x': this.x,
            'y': this.y,
            'instance_id': this.instance_id,
        };
    }
}
