import { readFileSync } from 'fs';

import { Random } from './math/random';

// tslint:disable-next-line: no-var-requires
const package_json = require('../package.json');

export const version = package_json.version;
export const versions = JSON.parse(String(readFileSync('config/versions.json')));
export const version_hash = JSON.parse(String(readFileSync('config/launch.json'))).hash;
export const launch_id = Random.uuid();
