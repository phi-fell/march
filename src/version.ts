var package_json = require('../package.json');
var uuid = require('uuid/v4');
var launch_id = uuid();
module.exports.version = package_json.version;
module.exports.launch_id = launch_id;