import * as t from 'io-ts';
import type { Entity } from './entity';
import { Location } from './location';
import { Position } from './position';

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
    protected constructor(loc: Location, emplaced: boolean = false) {
        this._location = loc;
        if (!emplaced) {
            this._location.cell.addLocatable(this);
        }
    }
    public isEntity(): this is Entity {
        return false;
    }
    public get location() {
        return this._location;
    }
    /**
     * Are you sure you mean to call this? This function is for moving between cells/instances.
     * It should be used for portals, stairs, entering a new zone, etc.
     * use setPosition for movement within a Cell
     */
    public setLocation(loc: Location) {
        if (this._location.cell === loc.cell) {
            this.setPosition(new Position(loc.x, loc.y))
        } else {
            this._location.cell.removeLocatable(this);
            this._location = loc;
            loc.cell.addLocatable(this);
        }
    }
    public setPosition(pos: Position) {
        this._location = this._location.withPosition(pos);
    }
}
