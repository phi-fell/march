import fs = require('fs');
import { resolve } from 'path';

import { Instance, InstanceAttributes } from './instance';
import { INSTANCE_GEN_TYPE } from './instancegenerator';
import { Random } from './math/random';
import { spawnMobFromSchema } from './mobschema';

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
    const schema = instanceSchemas[schema_id];
    const iattr = new InstanceAttributes(seed, schema.width, schema.height);
    iattr.schemaID = schema_id;
    iattr.genType = INSTANCE_GEN_TYPE[schema.generation];
    const inst = new Instance(iattr);
    for (const mob of schema.mobs) {
        for (let i = 0; i < mob.count; i++) {
            const ent = spawnMobFromSchema(mob.id, inst.getAvailableSpawningLocation());
            if (!ent) {
                console.log('Coult not create instance from schema "' + schema_id + '"! Could not get Mob!');
                return null;
            }
        }
    }
    inst.saveToDisk();
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

function addSchema(dir: string, filename: string) {
    fs.readFile(dir + '/' + filename, 'utf-8', (err, content) => {
        if (err) {
            return console.log(err);
        }
        const name = filename.split('.')[0];
        const props = JSON.parse(content);
        instanceSchemas[name] = props as InstanceSchema;
    });
}

function addSchemaDirectory(root: string, subdirectory: string | null = null) {
    const directory = root + (subdirectory ? ('/' + subdirectory) : '');
    fs.readdir(directory, (dir_err, filenames) => {
        if (dir_err) {
            return console.log(dir_err);
        }
        filenames.forEach((filename) => {
            const file = resolve(directory, filename);
            fs.stat(file, (stat_err, stat) => {
                if (stat && stat.isDirectory()) {
                    addSchemaDirectory(root, (subdirectory ? (subdirectory + '/') : '') + filename);
                } else {
                    addSchema(root, (subdirectory ? (subdirectory + '/') : '') + filename);
                }
            });
        });
    });
}

addSchemaDirectory('res/environment');
