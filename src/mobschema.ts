import fs = require('fs');

import type { CharacterRaceID } from './character/characterrace';
import { CharacterSheet } from './character/charactersheet';
import { Entity } from './old_entity';
import type { Location } from './old_location';

interface MobSchema {
    name: string;
    race: CharacterRaceID;
    attributes: any;
    skills: any;
}

const mobSchemas: { [id: string]: MobSchema; } = {};

export function spawnMobFromSchema(schema_id: string, location: Location) {
    if (mobSchemas[schema_id]) {
        const ret = new Entity(Entity.generateNewEntityID(), mobSchemas[schema_id].name, schema_id, location);
        const sheet = CharacterSheet.fromMobSchemaJSON(mobSchemas[schema_id]);
        if (sheet) {
            ret.charSheet = sheet;
            return ret;
        }
    }
    console.log('Could not spawn mob "' + schema_id + '" from schema! Invalid Sheet');
    return null;
}

mobSchemas.text = { 'name': '', 'race': '', 'attributes': {}, 'skills': {} };

fs.readdir('res/entity', (dir_err, filenames) => {
    if (dir_err) {
        return console.log(dir_err);
    }
    filenames.forEach((filename) => {
        fs.readFile('res/entity/' + filename, 'utf-8', (file_err, content) => {
            if (file_err) {
                return console.log(file_err);
            }
            const name = filename.split('.')[0];
            const props = JSON.parse(content);
            mobSchemas[name] = props as MobSchema;
        });
    });
});
