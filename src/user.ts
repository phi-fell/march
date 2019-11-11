import fs = require('fs');

import {
    generateAndGetFreshAuthTokenForId,
    getIfUsernameExists,
    getUserIdFromName,
    setUserIdByName,
    setUserPass,
    validateUserByIdAndAuthToken,
    validateUserByIdAndPass,
} from './auth';
import { ATTRIBUTE } from './character/characterattributes';
import { execute } from './commands';
import { DIRECTION } from './direction';
import { EQUIPMENT_SLOT } from './item/equipment_slot';
import { Random } from './math/random';
import {
    AttackAction,
    DropAction,
    EquipAction,
    MoveAction,
    PickupAction,
    Player,
    StrafeAction,
    TurnAction,
    UnequipAction,
    UnwaitAction,
    UsePortalAction,
    WaitAction,
} from './player';
import { getTilePalette } from './tile';

const users = {};

export class User {
    public id: string;
    public name: string;
    public online: boolean;
    public socket: any;
    public playerid: string | null;
    public player: Player | null;
    private _email: string | null;
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.online = false;
        this.socket = null;
        this.playerid = null;
        this.player = null;
        this._email = null;
    }
    get email(): string | null {
        return this._email;
    }
    set email(value: string | null) {
        this._email = value;
        this.saveToDisk();
    }
    public login(sock: SocketIO.Socket) {
        if (this.online) {
            // TODO: ERROR
            return console.log('USER IS ALREADY ONLINE');
        }
        this.socket = sock;
        this.online = true;
        if (this.player) {
            this.player.setActive(this);
        }
        const user = this;
        console.log(sock.handshake.address + ' logged in as ' + this.name);
        sock.on('disconnect', () => {
            user.logout();
        });
        sock.on('ping_cmd', (msg) => {
            console.log('ping from ' + user.name);
            sock.emit('pong_cmd', msg);
        });
        sock.on('chat message', (msg) => {
            if (user.player) {
                console.log(user.name + ':' + user.player.name + '> ' + msg);
                sock.emit('chat message', user.player.name + '> ' + msg);
                sock.broadcast.emit('chat message', user.player.name + '> ' + msg);
            } else {
                console.log('ERR: ' + user.name + ':NULL> ' + msg);
                sock.emit('chat message',
                    'Something went wrong.  You don\'t have a player? This is probably a bug, or too many events occured too quickly');
            }
        });
        sock.on('command', (msg) => {
            console.log(user.name + ' requests command /' + msg.cmd + ' with arguments [' + msg.tok.join(' ') + ']');
            execute(user, msg.cmd, msg.tok);
            if (user.player) {
                user.player.pushUpdate();
            }
        });
        sock.on('player_action', (msg) => {
            if (user.player) {
                switch (msg.action + '') {
                    case 'move_up':
                        user.player.setAction(new MoveAction(DIRECTION.UP));
                        break;
                    case 'move_left':
                        user.player.setAction(new MoveAction(DIRECTION.LEFT));
                        break;
                    case 'move_down':
                        user.player.setAction(new MoveAction(DIRECTION.DOWN));
                        break;
                    case 'move_right':
                        user.player.setAction(new MoveAction(DIRECTION.RIGHT));
                        break;
                    case 'strafe_up':
                        user.player.setAction(new StrafeAction(DIRECTION.UP));
                        break;
                    case 'strafe_left':
                        user.player.setAction(new StrafeAction(DIRECTION.LEFT));
                        break;
                    case 'strafe_down':
                        user.player.setAction(new StrafeAction(DIRECTION.DOWN));
                        break;
                    case 'strafe_right':
                        user.player.setAction(new StrafeAction(DIRECTION.RIGHT));
                        break;
                    case 'turn_up':
                        user.player.setAction(new TurnAction(DIRECTION.UP));
                        break;
                    case 'turn_left':
                        user.player.setAction(new TurnAction(DIRECTION.LEFT));
                        break;
                    case 'turn_down':
                        user.player.setAction(new TurnAction(DIRECTION.DOWN));
                        break;
                    case 'turn_right':
                        user.player.setAction(new TurnAction(DIRECTION.RIGHT));
                        break;
                    case 'wait':
                        user.player.setAction(new WaitAction());
                        break;
                    case 'unwait':
                        user.player.setAction(new UnwaitAction());
                        break;
                    case 'attack':
                        user.player.setAction(new AttackAction());
                        break;
                    case 'portal':
                        user.player.setAction(new UsePortalAction());
                        break;
                    case 'pickup':
                        user.player.setAction(new PickupAction(msg.schema, msg.count));
                        break;
                    case 'drop':
                        user.player.setAction(new DropAction(msg.schema, msg.count));
                        break;
                    case 'equip':
                        user.player.setAction(new EquipAction(msg.item_id));
                        break;
                    case 'unequip':
                        user.player.setAction(new UnequipAction(EQUIPMENT_SLOT[msg.slot as string]));
                        break;
                    default:
                        sock.emit('log', 'unknown action: ' + msg.action);
                        break;
                }
            } else {
                console.log('can\'t move nonexistent player');
            }
        });
        sock.on('levelup', (msg) => {
            if (user.player) {
                if (msg.type === 'attribute') {
                    user.player.charSheet.levelUpAttribute(ATTRIBUTE[msg.attr as string]);
                    user.player.pushUpdate();
                } else {
                    console.log('unknown level up type requested: ' + msg.type);
                }
            } else {
                console.log('cannot level up user with null player');
            }
        });

        this.socket.emit('palette', getTilePalette());
        this.socket.emit('chat message', 'Welcome, ' + this.name + '!');
        // tslint:disable-next-line: max-line-length
        this.socket.emit('chat message', 'Please be aware that during developement, free users may be deleted at any time by developer discretion (usually on major releases, or after a period of no activity)');
        // tslint:disable-next-line: max-line-length
        this.socket.emit('chat message', 'For notifications about developement and to be given priority access to features and possibly a longer delay before account purging, use /email');
        // tslint:disable-next-line: max-line-length
        this.socket.emit('chat message', '(By setting an email address, you give permission for it to be contacted regarding game updates, news, account info, or anything else.  Your email may also be contacted to followup on any bug reports you submit.  You can remove your email simply by changing it to e.g. "none")');
        // giveSocketBasicPrivileges(socket);
        this.socket.broadcast.emit('chat message', this.name + ' connected');

        if (!this.socket.connected) {
            this.logout();
        }
    }
    public logout() {
        if (!this.online) {
            // TODO: ERROR
            return console.log('USER IS NOT LOGGED IN');
        }
        console.log(this.name + ' logged out.');
        this.saveToDisk();
        if (this.player) {
            this.player.setInactive();
        }
        // TODO: close socket, and save to disk?
        this.socket.disconnect();
        this.online = false;
        this.unload();
    }
    public loadFromData(data) {
        this.id = data.id;
        this.name = data.name;
        if (data.playerid) {
            this.playerid = data.playerid;
            const user: User = this;
            Player.loadPlayer(this.playerid, (err, plr) => {
                if (err) {
                    console.log(err);
                } else {
                    user.player = plr;
                    if (user.online) {
                        user.player!.setActive(user);
                    }
                }
            });
        }
        this.email = data.email;
        // TODO: keep info on if player exists? on guest status? etc.
    }
    public unload() {
        if (this.online) {
            return console.log('ONLINE USERS CANNOT BE UNLOADED.  LOG OUT FIRST!');
        }
        // TODO: save data? (or should it be assumed to have been saved on edit?);
        delete users[this.id];
    }
    public saveToDisk() {
        const data = {
            'id': this.id,
            'name': this.name,
            'playerid': this.playerid,
            'email': this.email,
        };
        fs.writeFile('users/' + this.id + '.user', JSON.stringify(data), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
    public getFreshAuthToken(callback) {
        generateAndGetFreshAuthTokenForId(this.id, callback);
    }
}

export function getLoadedUserByID(id) {
    if (id in users) {
        return users[id];
    }
    return null;
}
export function getLoadedUserByName(name): User | null {
    const ret = Object.values(users).find((u: any) => u.name === name);
    if (ret) {
        return ret as User;
    }
    return null;
}

function generateUserID() {
    const id = Random.uuid(); // assumed to never repeat TODO: ? ensure this somehow?
    /*
    while (getUser(id)) {
        id = Random.uuid();
    }
    */
    // tslint:disable-next-line: no-var-before-return
    return id;
}

export function createNewUser(name, pass, callback) {
    getIfUsernameExists(name, (err, exists) => {
        if (exists) {
            return callback('Username in use', null);
        }
        const id = generateUserID();
        const ret = new User(id, name);
        ret.saveToDisk();
        users[id] = ret;
        setUserIdByName(id, name);
        setUserPass(id, pass);
        return callback(null, ret);
    });
}
export function validateCredentialsByAuthToken(username, token, callback) {
    if (username && token && callback) {
        getUserIdFromName(username, (err, id) => {
            if (err) {
                return callback(err, false);
            }
            return validateUserByIdAndAuthToken(id, token, (val_err, res) => {
                if (val_err) {
                    return callback(val_err, false);
                }
                if (res) {
                    return callback(null, true);
                }
                return callback(null, false);
            });

        });
    } else {
        try {
            callback('invalid params', false);
        } catch (e) { /* nothing */ }
    }
}
export function validateCredentialsByPassAndGetAuthToken(username, pass, callback) {
    if (username && pass && callback) {
        getUserIdFromName(username, (get_err, id) => {
            if (get_err) {
                return callback(get_err, false);
            }
            return validateUserByIdAndPass(id, pass, (val_err, res) => {
                if (val_err) {
                    return callback(val_err, false);
                }
                if (res) {
                    generateAndGetFreshAuthTokenForId(id, (_err, token) => {
                        callback(null, true, token);
                    });
                } else {
                    return callback(null, false);
                }
            });
        });
    } else if (callback) {
        callback('invalid params', false);
    }
}
export function loadUserByName(name, callback) {
    if (!callback) {
        callback = (err) => {
            if (err) {
                console.log(err);
            }
        };
    }
    getUserIdFromName(name, (auth_err, id) => {
        if (auth_err) {
            callback(auth_err);
        } else {
            fs.readFile('users/' + id + '.user', (read_err, data) => {
                if (read_err) {
                    return callback(read_err);
                }
                const ret = new User(id, name);
                ret.loadFromData(JSON.parse('' + data));
                users[id] = ret;
                callback(null, ret);
            });
        }
    });
}
