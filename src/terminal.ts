import { createContext, runInContext } from 'vm';

import { Entity } from './deprecated/old_entity';
import { Instance } from './deprecated/old_instance';
import { Player } from './deprecated/old_player';
import { User } from './user';

class Logger {
    private _buf: string = '';
    constructor() {
        //
    }
    public log(s: string) {
        this._buf += s + '\n';
    }
    public getLog() {
        return this._buf;
    }
    public clear() {
        this._buf = '';
    }
}

const log = new Logger();
const sandbox = {
    'console': log,
    'Instance': Instance,
    'User': User,
    'Entity': Entity,
    'Player': Player,
};
const context = createContext(sandbox);

export function executeCmd(cmd: string) {
    try {
        log.clear();
        const ret = runInContext(cmd, context);
        return log.getLog() + (ret ? ret : '');
    } catch (e) {
        return '' + e;
    }
}
