import fs = require('fs');
var uuid = require('uuid/v4');
var auth = require('./auth');
var commands = require('./commands');
import { Player, WaitAction, MoveAction, UnwaitAction } from './player';
import { ATTRIBUTE } from './characterattributes';
import { getTilePalette } from './tile';

var users = {};

export class User {
    id: string;
    name: string;
    online: boolean;
    socket: any;
    playerid: string | null;
    player: Player | null;
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
        return this._email
    }
    set email(value: string | null) {
        this._email = value;
        this.saveToDisk();
    }
    login(sock: SocketIO.Socket) {
        if (this.online) {
            //TODO: ERROR
            return console.log('USER IS ALREADY ONLINE');
        }
        this.socket = sock;
        this.online = true;
        if (this.player) {
            this.player.setActive(this);
        }
        var user = this;
        sock.on('disconnect', function () {
            console.log(user.name + ' (' + sock.handshake.address + ') disconnected');
            user.logout();
        });
        sock.on('ping_cmd', function (msg) {
            console.log('ping from ' + user.name);
            sock.emit('pong_cmd', msg);
        });
        sock.on('chat message', function (msg) {
            if (user.player) {
                console.log(user.name + ':' + user.player.name + '> ' + msg);
                sock.emit('chat message', user.player.name + '> ' + msg);
                sock.broadcast.emit('chat message', user.player.name + '> ' + msg);
            } else {
                console.log('ERR: ' + user.name + ':NULL> ' + msg);
                sock.emit('chat message', 'Something went wrong.  You don\'t have a player? This is probably a bug, or too many events occured too quickly');
            }
        });
        sock.on('command', function (msg) {
            console.log(user.name + ' requests command /' + msg.cmd + ' with arguments [' + msg.tok.join(' ') + ']')
            commands.execute(user, msg.cmd, msg.tok);
            if (user.player) {
                user.player.pushUpdate();
            }
        });
        sock.on('player_action', function (msg) {
            if (user.player) {
                switch (msg + '') {
                    case 'move_up':
                        user.player.setAction(new MoveAction('up'));
                        break;
                    case 'move_left':
                        user.player.setAction(new MoveAction('left'));
                        break;
                    case 'move_down':
                        user.player.setAction(new MoveAction('down'));
                        break;
                    case 'move_right':
                        user.player.setAction(new MoveAction('right'));
                        break;
                    case 'wait':
                        user.player.setAction(new WaitAction());
                        break;
                    case 'unwait':
                        user.player.setAction(new UnwaitAction());
                        break;
                    default:
                        sock.emit('log', 'unknown action: ' + msg);
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
        this.socket.emit('chat message', 'Please be aware that during developement, free users may be deleted at any time by developer discretion (usually on major releases, or after a period of no activity)');
        this.socket.emit('chat message', 'For notifications about developement and to be given priority access to features and possibly a longer delay before account purging, use /email');
        this.socket.emit('chat message', '(By setting an email address, you give permission for it to be contacted regarding game updates, news, account info, or anything else.  Your email may also be contacted to followup on any bug reports you submit.  You can remove your email simply by changing it to e.g. "none")');
        //giveSocketBasicPrivileges(socket);
        this.socket.broadcast.emit('chat message', this.name + ' connected');
    }
    logout() {
        if (!this.online) {
            //TODO: ERROR
            return console.log('USER IS NOT LOGGED IN');
        }
        this.saveToDisk();
        if (this.player) {
            this.player.setInactive();
        }
        //TODO: close socket, and save to disk?
        this.socket.disconnect();
        this.socket = null;
        this.online = false;
        this.unload();
    }
    loadFromData(data) {
        this.id = data.id;
        this.name = data.name;
        if (data.playerid) {
            this.playerid = data.playerid;
            var user: User = this;
            Player.loadPlayer(this.playerid, function (err, plr) {
                if (err) {
                    console.log(err);
                } else {
                    user.player = plr;
                    if (user.online) {
                        user.player!.setActive(user);
                    }
                }
            });
        } else {
            this.player = Player.createPlayer();
            this.playerid = this.player.id;
            if (this.online) {
                this.player.setActive(this);
            }
            this.saveToDisk();
        }
        this.email = data.email;
        //TODO: keep info on if player exists? on guest status? etc.
    }
    unload() {
        if (this.online) {
            return console.log('ONLINE USERS CANNOT BE UNLOADED.  LOG OUT FIRST!');
        } else {
            //TODO: save data? (or should it be assumed to have been saved on edit?);
            delete users[this.id];
        }
    }
    saveToDisk() {
        var data = {
            'id': this.id,
            'name': this.name,
            'playerid': this.playerid,
            'email': this.email,
        }
        fs.writeFile('users/' + this.id + '.user', JSON.stringify(data), function (err) {
            if (err) {
                console.log(err);
            }
        });
    }
    getFreshAuthToken(callback) {
        auth.generateAndGetFreshAuthTokenForId(this.id, callback);
    }
}

function getLoadedUserByID(id) {
    if (id in users) {
        return users[id];
    } else {
        return null;
    }
}
module.exports.getLoadedUserByID = getLoadedUserByID;
function getLoadedUserByName(name) {
    return Object.values(users).find((u: any) => { return u.name === name });
}
module.exports.getLoadedUserByName = getLoadedUserByName;
module.exports.deleteUser = function (id) {
    //TODO
}

function generateUserID() {
    var id = uuid();//assumed to never repeat TODO: ? ensure this somehow?
    /*
    while (getUser(id)) {
        id = uuid();
    }
    */
    return id;
}

module.exports.createNewUser = function (name, pass, callback) {
    auth.getIfUsernameExists(name, function (err, exists) {
        if (exists) {
            return callback('Username in use', null);
        } else {
            var id = generateUserID();
            var ret = new User(id, name);
            ret.player = Player.createPlayer();
            ret.playerid = ret.player.id;
            ret.player.unload();
            ret.saveToDisk();
            users[id] = ret;
            auth.setUserIdByName(id, name);
            auth.setUserPass(id, pass);
            return callback(null, ret);
        }
    });
}
module.exports.validateCredentialsByAuthToken = function (username, token, callback) {
    if (username && token && callback) {
        auth.getUserIdFromName(username, function (err, id) {
            if (err) {
                return callback(err, false);
            } else {
                return auth.validateUserByIdAndAuthToken(id, token, function (err, res) {
                    if (err) {
                        return callback(err, false);
                    } else if (res) {
                        return callback(null, true);
                    } else {
                        return callback(null, false);
                    }
                });
            }
        });
    } else {
        try {
            callback('invalid params', false);
        } catch (e) { };
    }
}
module.exports.validateCredentialsByPassAndGetAuthToken = function (username, pass, callback) {
    if (username && pass && callback) {
        auth.getUserIdFromName(username, function (err, id) {
            if (err) {
                return callback(err, false);
            } else {
                return auth.validateUserByIdAndPass(id, pass, function (err, res) {
                    if (err) {
                        return callback(err, false);
                    } else if (res) {
                        auth.generateAndGetFreshAuthTokenForId(id, function (err, token) {
                            callback(null, true, token);
                        });
                    } else {
                        return callback(null, false);
                    }
                });
            }
        });
    } else {
        try {
            callback('invalid params', false);
        } catch (e) { };
    }
}
module.exports.loadUserByName = function (name, callback) {
    if (!callback) {
        callback = function (err) {
            if (err) {
                console.log(err);
            }
        };
    }
    auth.getUserIdFromName(name, function (err, id) {
        if (err) {
            callback(err);
        } else {
            fs.readFile('users/' + id + '.user', function (err, data) {
                if (err) {
                    return callback(err);
                } else {
                    var ret = new User(id, name);
                    ret.loadFromData(JSON.parse('' + data));
                    users[id] = ret;
                    callback(null, ret);
                }
            });
        }
    });
}