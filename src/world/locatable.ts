import type { Entity } from './entity';
import { Location } from './location';
import type { Position } from './position';

export abstract class Locatable {
    private _location: Location;
    constructor(loc: Location) {
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
