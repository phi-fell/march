import * as t from 'io-ts';

export const position_schema = t.type({
    'x': t.number,
    'y': t.number,

});

export type PositionSchema = t.TypeOf<typeof position_schema>;

export class Position {
    constructor(private readonly _x: number, private readonly _y: number) {
    }
    get x(): number {
        return this._x;
    }
    get y(): number {
        return this._y;
    }
    public translate(dx: number, dy: number) {
        return new Position(this._x + dx, this._y + dy);
    }
    public equals(rhs: Position) {
        return this._x === rhs.x && this._y === rhs.y;
    }
    public toJSON(): PositionSchema {
        return {
            'x': this.x,
            'y': this.y,
        };
    }
}
