import bcrypt = require('bcrypt');
import fs = require('fs');
import uuid = require('uuid/v4');
function generateNewUserPassword() {
    return uuid();
}
function generateFreshAuthToken() {
    return uuid();
}
function createUserAndGetPass(id: string) {
    const pass = generateNewUserPassword();
    setUserPass(id, pass);
    return pass;
}
function setUserPasswordHash(id: string, hash: string) {
    fs.writeFile('users/' + id + '.hash', hash, (err: any) => {
        if (err) {
            console.log(err);
        }
    });
}
function setUserPass(id: string, pass: string) {
    bcrypt.hash(pass, 10, (err: any, hash: any) => {
        if (err) {
            console.log(err);
        } else {
            setUserPasswordHash(id, hash);
        }
    });
}
function setUserIdByName(id: string, name: string, callback: any) {
    fs.writeFile('users/' + name.toLowerCase() + '.id', id + '\n' + name, function (err: any) {
        if (err) {
            console.log(err);
            if (callback) {
                return callback(err);
            }
        } else {
            if (callback) {
                return callback(null);
            }
        }
    });
}
function getUserIdFromName(name: string, callback: any) {
    fs.readFile('users/' + name.toLowerCase() + '.id', function (err: any, data: any) {
        if (err) {
            return callback(err);
        } else {
            const lines = (data + '').split('\n');
            if (name === lines[1]) {
                return callback(null, lines[0]);
            } else {
                return callback('User does not case-sensitively exist (or the .id file is corrupt)');
            }
        }
    });
}
function getIfUsernameExists(name: string, callback: any) {
    fs.readFile('users/' + name.toLowerCase() + '.id', function (err: any, data: any) {
        if (err) {
            return callback(null, false);
        } else {
            const lines = (data + '').split('\n');
            if (name === lines[1]) {
                return callback(null, true);
            } else {
                // for now we don't allow usernames that only differ by case
                // (note the toLowerCase() used on file saving/loading)
                return callback('User does not case-sensitively exist (or the .id file is corrupt)', true);
            }
        }
    });
}
module.exports = {
    'createUserAndGetPass': createUserAndGetPass,
    'getUserIdFromName': getUserIdFromName,
    'setUserPass': setUserPass,
};
module.exports.getIfUsernameExists = getIfUsernameExists;
module.exports.generateAndGetFreshAuthTokenForId = function (id: string, callback: any) {
    const token = generateFreshAuthToken();
    bcrypt.hash(token, 10, function (err: any, hash: any) {
        if (err) {
            callback(err);
        } else {
            fs.writeFile('users/' + id + '.auth', hash + '\n' + Date.now(), (err: any) => {
                if (err) {
                    console.log(err);
                    if (callback) {
                        return callback(err);
                    }
                } else {
                    return callback(null, token);
                }
            });
        }
    });
}
module.exports.validateUserByIdAndPass = function (id: string, pass: string, callback: any) {
    fs.readFile('users/' + id + '.hash', function (err: any, data: any) {
        if (err) {
            return callback(err);
        } else {
            bcrypt.compare(pass, data + '', function (err: any, res: boolean) {
                if (err) {
                    return callback(err);
                } else if (res) {
                    return callback(null, true);
                } else {
                    return callback(null, false);
                }
            });
        }
    });
}
module.exports.validateUserByIdAndAuthToken = function (id: string, token: string, callback: any) {
    fs.readFile('users/' + id + '.auth', (err: any, data: any) => {
        if (err) {
            return callback(err, false);
        }
        const sd = ('' + data).split('\n');
        const hash = sd[0];
        const date = sd[1];
        if (Date.now() - parseInt(date) > 1000 * 60 * 60 * 24 * 3) {
            callback(null, false);//Invalidate after 3 days
        }
        bcrypt.compare(token, hash, function (err: any, res: boolean) {
            if (err) {
                return callback(err);
            }
            if (res) {
                return callback(null, true);
            }
            return callback(null, false);
        });
    });
}
module.exports.setUserIdByName = setUserIdByName;