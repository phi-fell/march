import { Instance } from './instance';
import { getInstanceFromSchema, InstanceSchemaID } from './instanceschema';
import { Location } from './location';
import { Random } from './math/random';

export class Portal {
    public destination: Location | null = null;
    constructor(public location: Location, public destination_schema: InstanceSchemaID, public seed = Random.getDeterministicID()) {
    }
    public getReifiedDestination(): Location {
        this.reify();
        return this.destination!;
    }
    public reify() {
        console.log(JSON.stringify(this));
        if (this.destination && Instance.getLoadedInstanceById(this.destination.instance_id)) {
            return true;
        }
        const inst: Instance | null = getInstanceFromSchema(this.destination_schema, this.seed);
        if (!inst) {
            console.log('Destination could not be reified.  Failed to construct instance of "' + this.destination_schema + '"');
            return false;
        }
        if (inst.portals.length) {
            this.destination = inst.portals[0].location;
            inst.portals[0].destination = this.location;
            return true;
        }
        console.log('Portal could not be reified, no portals exist in destination.');
        return false;
    }
}
