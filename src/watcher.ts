import { exec, execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

function execute(command, callback) {
    exec(command, (error, stdout, stderr) => { callback(stdout); });
}

function executeSync(command) {
    execSync(command, { 'stdio': 'inherit' });
}

class Watcher {
    private watched_process: any | null = null;
    private child_args: string[] = [];
    private debug: boolean = false;
    constructor(args: string[]) {
        args.forEach((val, index, array) => {
            if (val === '-NO_HTTPS') {
                this.child_args.push('-NO_HTTPS');
            } else if (val === '-PUBLISH_DIAGNOSTIC_DATA') {
                this.child_args.push('-PUBLISH_DIAGNOSTIC_DATA');
            } else if (val === '-UNLOCK_DIAGNOSTIC') {
                this.child_args.push('-UNLOCK_DIAGNOSTIC');
            } else if (val === '-DEBUG') {
                this.debug = true;
            }
        });
    }
    public start() {
        execute('git checkout master && git pull', () => {
            execute('git log', (output) => {
                const regex = /(?:commit )([a-z0-9]+)(?:[\n]*Author[^\n]*)(?:[\n]Date[^\n]*[\s]*)([^\n]*)/g;
                let match = regex.exec(output);
                const versions: any[] = [];
                while (match) {
                    if (match[2].match(/^[0-9]+.[0-9]+.[0-9]+$/)) {
                        versions.push({
                            'version': match[2],
                            'hash': match[1],
                        });
                    }
                    match = regex.exec(output);
                }
                writeFileSync('config/versions.json', JSON.stringify(versions));

                const launch_version = JSON.parse(String(readFileSync('config/launch.json')));
                executeSync('git checkout ' + launch_version.hash);
                if (launch_version.rebuild) {
                    executeSync('npm run build');
                    launch_version.rebuild = false;
                    writeFileSync('config/launch.json', JSON.stringify(launch_version));
                }
                if (this.watched_process) {
                    return;
                }
                this.watched_process = spawn(
                    'node',
                    ((this.debug) ? ['--inspect'] : []).concat(['build/index.js']).concat(this.child_args),
                    {
                        'stdio': [0, 1, 2, 'ipc'],
                    },
                );
                this.watched_process.on('exit', (code, signal) => {
                    if (signal) {
                        console.log('child crashed with code ' + code + ' and signal ' + signal);
                    } else {
                        console.log('child process exited normally with code ' + code);
                    }
                    console.log('restarting...');
                    this.watched_process = null;
                    this.start();
                });
            });
        });
    }
}

const watcher = new Watcher(process.argv);
watcher.start();
