import * as t from 'io-ts';

export const LocationDataType = t.type({
    'instance_id': t.string,
    'x': t.number,
    'y': t.number,
});

export class Location {
    public static fromJSON(json: t.TypeOf<typeof LocationDataType>) {
        return new Location(json.x, json.y, json.instance_id);
    }
    constructor(private _x: number, private _y: number, private _instance_id: string) {
    }
    get x(): number {
        return this._x;
    }
    get y(): number {
        return this._y;
    }
    get instance_id(): string {
        return this._instance_id;
    }
    public getMovedBy(dx: number, dy: number) {
        return new Location(this._x + dx, this._y + dy, this._instance_id);
    }
    public equals(rhs: Location) {
        return this._x === rhs._x && this._y === rhs._y && this._instance_id === rhs._instance_id;
    }
    public clone() {
        return new Location(this._x, this._y, this._instance_id);
    }
    public toJSON() {
        return {
            'x': this.x,
            'y': this.y,
            'instance_id': this.instance_id,
        };
    }
}
