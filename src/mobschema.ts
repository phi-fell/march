import fs = require('fs');

import { CharacterRaceID } from './character/characterrace';
import { CharacterSheet } from './character/charactersheet';
import { Entity } from './entity';

interface MobSchema {
    name: string;
    race: CharacterRaceID;
    attributes: any;
    skills: any;
}

const mobSchemas: { [id: string]: MobSchema; } = {};

export function getMobFromSchema(schema_id: string) {
    const ret = new Entity(Entity.generateNewEntityID(), mobSchemas[schema_id].name, schema_id);
    const sheet = CharacterSheet.fromMobSchemaJSON(mobSchemas[schema_id]);
    if (sheet) {
        ret.charSheet = sheet;
        return ret;
    }
    console.log('Could not get mob "' + schema_id + '" from schema! Invalid Sheet');
    return null;
}

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
