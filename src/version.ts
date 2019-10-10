import uuid = require('uuid/v4');
// tslint:disable-next-line: no-var-requires
const package_json = require('../package.json');

export const version = package_json.version;
export const launch_id = uuid();
