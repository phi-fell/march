import { Instance } from './instance';
import { getInstanceFromSchema, InstanceSchemaID } from './instanceschema';
import { Location } from './location';
import { Random } from './math/random';

export class Portal {
    public static fromJSON(json: any): Portal {
        const ret = new Portal(Location.fromJSON(json.location), json.destination_schema, json.seed);
        ret.destination = (json.destination) ? Location.fromJSON(json.destination) : (json.destination);
        return ret;
    }
    public destination: Location | null = null;
    constructor(public location: Location, public destination_schema: InstanceSchemaID, public seed = Random.getDeterministicID()) {
    }
    public reify(callback: (err: any, des: Location | null) => any) {
        if (this.destination && Instance.getLoadedInstanceById(this.destination.instance_id)) {
            return callback(null, this.destination);
        }
        if (this.destination) {
            const dest = this.destination;
            (async () => {
                const inst = await Instance.loadInstance(dest.instance_id);
                return callback(inst ? (null) : 'Error: undefined instance', this.destination);
            })();
            return;
        }
        const inst: Instance | null = getInstanceFromSchema(this.destination_schema, this.seed);
        if (!inst) {
            const err = 'Destination could not be reified.  Failed to construct instance of "' + this.destination_schema + '"';
            console.log(err);
            return callback(err, null);
        }
        if (inst.portals.length) {
            this.destination = inst.portals[0].location;
            inst.portals[0].destination = this.location;
            return callback(null, this.destination);
        }
        const err = 'Portal could not be reified, no portals exist in destination.';
        console.log(err);
        return callback(err, null);
    }
    public toJSON() {
        return {
            'location': this.location,
            'destination': (this.destination) ? this.destination.toJSON() : (this.destination),
            'destination_schema': this.destination_schema,
            'seed': this.seed,
        };
    }
}
