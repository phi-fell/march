import fs = require('fs');

import { Instance, InstanceAttributes } from './instance';
import { INSTANCE_GEN_TYPE } from './instancegenerator';
import { Random } from './math/random';
import { getMobFromSchema } from './mobschema';

interface InstanceSchema {
    name: string;
    generation: string;
    width: number;
    height: number;
    mobs: any[];
    adjacencies: any[];
}

export type InstanceSchemaID = string;

const instanceSchemas: { [id: string]: InstanceSchema; } = {};

export function getInstanceFromSchema(schema_id: InstanceSchemaID, seed: string): Instance | null {
    Random.reSeed(seed);
    const schema = instanceSchemas[schema_id];
    const iattr = new InstanceAttributes(seed, schema.width, schema.height);
    iattr.schemaID = schema_id;
    iattr.genType = INSTANCE_GEN_TYPE[schema.generation];
    const inst = Instance.spinUpNewInstance(iattr);
    for (const mob of schema.mobs) {
        for (let i = 0; i < mob.count; i++) {
            const ent = getMobFromSchema(mob.id);
            if (!ent) {
                console.log('Coult not create instance from schema "' + schema_id + '"! Could not get Mob!');
                return null;
            }
            inst.spawnEntityAnywhere(ent);
        }
    }
    return inst;
}

export function getRandomAdjacency(schema_id: InstanceSchemaID) {
    const schema = instanceSchemas[schema_id];
    let total = 0;
    for (const adjacency of schema.adjacencies) {
        total += adjacency.weight;
    }
    let rand = Random.float() * total;
    for (const adjacency of schema.adjacencies) {
        rand -= adjacency.weight;
        if (rand <= 0) {
            return adjacency.id;
        }
    }
}

fs.readdir('res/environment', (dir_err, filenames) => {
    if (dir_err) {
        return console.log(dir_err);
    }
    filenames.forEach((filename) => {
        fs.readFile('res/environment/' + filename, 'utf-8', (read_err, content) => {
            if (read_err) {
                return console.log(read_err);
            }
            const name = filename.split('.')[0];
            const props = JSON.parse(content);
            instanceSchemas[name] = props as InstanceSchema;
        });
    });
});
