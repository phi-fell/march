import { exec, execSync } from 'child_process';
import { readFileSync } from 'fs';

import { Random } from './math/random';

// tslint:disable-next-line: no-var-requires
const package_json = require('../package.json');

export const version = package_json.version;
export let versions = JSON.parse(String(readFileSync('config/versions.json')));
export const version_hash = JSON.parse(String(readFileSync('config/launch.json'))).hash;
export const launch_id = Random.uuid();

export class Version {
    public static refresh() {
        exec('git checkout master && git pull', () => {
            exec('git log', (error, stdout, stderr) => {
                const regex = /(?:commit )([a-z0-9]+)(?:[\n]*Author[^\n]*)(?:[\n]Date[^\n]*[\s]*)([^\n]*)/g;
                let match = regex.exec(stdout);
                versions = [];
                while (match) {
                    if (match[2].match(/^[0-9]+.[0-9]+.[0-9]+$/)) {
                        versions.push({
                            'version': match[2],
                            'hash': match[1],
                        });
                    }
                    match = regex.exec(stdout);
                }
                execSync('git checkout ' + version_hash, { 'stdio': 'inherit' });
            });
        });
    }
}
