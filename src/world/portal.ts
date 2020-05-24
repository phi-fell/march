import * as t from 'io-ts';
import type { Cell } from './cell';
import type { Entity } from './entity';
import { Location, LocationSchema } from './location';
import type { World } from './world';

export type PortalSchema = t.TypeOf<typeof Portal.schema>;

export class Portal {
    public static schema = t.type({
        'blueprint': t.string,
        'reified': t.boolean,
        'destination': t.union([Location.schema, t.undefined]),
    });

    public static fromJSON(json: PortalSchema, entity: Entity): Portal {
        const ret = new Portal(entity.location, json.blueprint);
        ret.reified = json.reified;
        ret.destination = json.destination;
        return ret;
    }
    private reified: boolean = false;
    private reification_promise?: Promise<void>;
    private destination?: LocationSchema;
    constructor(private location: Location, private blueprint: string) { }
    public async getDestination(world: World): Promise<Location> {
        if (this.reified) {
            if (this.reification_promise !== undefined) {
                await this.reification_promise;
            }
            if (this.destination !== undefined) {
                return Location.fromJSONWithWorld(world, this.destination);
            }
            console.log('NO DESTINATION FOR REIFIED PORTAL!!!');
        }
        this.reify(world);
        return this.getDestination(world);
    }
    private reify(world: World) {
        if (this.reified) {
            return;
        }
        this.reified = true;
        this.reification_promise = (async () => {
            const bp = await world.globals.cell_blueprint_manager.get(this.blueprint);
            if (bp === undefined) {
                throw new Error(`Cannot reify portal! No such blueprint as: ${this.blueprint}`);
            }
            const cell: Cell = await this.location.cell.instance.createCell(bp, world.globals);
            this.destination = cell.getRandomEmptyLocation();
            this.reification_promise = undefined;
        })();
    }
    public toJSON(): PortalSchema {
        return {
            'blueprint': this.blueprint,
            'reified': this.reified,
            'destination': this.destination,
        };
    }
    public getClientJSON(viewer: Entity) {
        return true;
    }
}
