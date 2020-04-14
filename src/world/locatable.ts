import type { Entity } from './entity';
import { Location } from './location';
import { Position } from './position';
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
    private _ready: Promise<void>;
    private _location: Location;
    protected constructor(private world: World, loc: Location) {
        this._location = loc;
        this._ready = this.finishConstruction();
    }
    private async finishConstruction() {
        const inst = await this.world.getInstance(this._location.instance_id);
        const cell = await inst.getCell(this._location.cell_id)
        cell.addLocatable(this);
    }
    protected async ready(): Promise<void> {
        return this._ready;
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
    public async setLocation(loc: Location) {
        if (this._location.instance_id === loc.instance_id && this.location.cell_id === loc.cell_id) {
            this.setPosition(new Position(loc.x, loc.y))
        } else {
            const from_inst = this.world.getInstance(this._location.instance_id);
            const to_inst = this.world.getInstance(loc.instance_id);

            const from_cell_p = (await from_inst).getCell(this._location.cell_id);
            const to_cell_p = (await to_inst).getCell(loc.cell_id)

            const from_cell = await from_cell_p;
            const to_cell = await to_cell_p;

            this._location = loc;
            from_cell.removeLocatable(this);
            to_cell.addLocatable(this);
        }
    }
    public setPosition(pos: Position) {
        this._location = new Location(pos.x, pos.y, this._location.instance_id, this._location.cell_id);
    }
}
