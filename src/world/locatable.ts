import type { Entity } from './entity';
import { Location } from './location';
import type { Position } from './position';
import * as t from 'io-ts';
import type { World } from './world';

export const locatable_schema = t.type({
    'location': Location.schema
});

export type LocatableSchema = t.TypeOf<typeof locatable_schema>

/**
 * This class exists to keep all the handling of locations separate from Entity
 * this lets it be small and clean and easy to validate that setting location also moves the Locatable
 * to the correct Cell, etc.
 */
export abstract class Locatable {
    private _location: Location;
    constructor(private world: World, loc: Location) {
        this._location = loc;
    }
    public isEntity(): this is Entity {
        return false;
    }
    public get location() {
        return this._location;
    }
    public setLocation(loc: Location) {
        this._location = loc;
    }
    public setPosition(pos: Position) {
        this._location = new Location(pos.x, pos.y, this._location.instance_id);
    }
}
