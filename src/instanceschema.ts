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

const instanceSchemas: { [id: string]: InstanceSchema; } = {};

export function getInstanceFromSchema(schema_id: string, seed: string = Random.uuid()): Instance | null {
    const schema = instanceSchemas[schema_id];
    const iattr = new InstanceAttributes(seed, schema.width, schema.height);
    iattr.genType = INSTANCE_GEN_TYPE[schema.generation];
    const inst = Instance.spinUpNewInstance(iattr);
    for (const mob of schema.mobs) {
        for (let i = 0; i < mob.count; i++) {
            const ent = getMobFromSchema(mob.id);
            if (!ent) {
                return null;
            }
            inst.spawnEntityAnywhere(ent);
        }
    }
    return inst;
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
