import bcrypt = require('bcrypt');
import fs = require('fs');

import { Random } from './math/random';

function generateNewUserPassword() {
    return Random.uuid();
}

function generateFreshAuthToken() {
    return Random.uuid();
}

export function createUserAndGetPass(id: string) {
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

export function setUserPass(id: string, pass: string) {
    bcrypt.hash(pass, 10, (err: any, hash: any) => {
        if (err) {
            console.log(err);
        } else {
            setUserPasswordHash(id, hash);
        }
    });
}

export function setUserIdByName(id: string, name: string, callback?: any) {
    fs.writeFile('users/' + name.toLowerCase() + '.id', id + '\n' + name, (err: any) => {
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

export function getUserIdFromName(name: string, callback: any) {
    fs.readFile('users/' + name.toLowerCase() + '.id', (err: any, data: any) => {
        if (err) {
            return callback(err);
        }
        const lines = (data + '').split('\n');
        if (name === lines[1]) {
            return callback(null, lines[0]);
        }
        return callback('User does not case-sensitively exist (or the .id file is corrupt)');
    });
}

export function getIfUsernameExists(name: string, callback: any) {
    fs.readFile('users/' + name.toLowerCase() + '.id', (err: any, data: any) => {
        if (err) {
            return callback(null, false);
        }
        const lines = (data + '').split('\n');
        if (name === lines[1]) {
            return callback(null, true);
        }
        // for now we don't allow usernames that only differ by case
        // (note the toLowerCase() used on file saving/loading)
        return callback('User does not case-sensitively exist (or the .id file is corrupt)', true);
    });
}

export function generateAndGetFreshAuthTokenForId(id: string, callback: any) {
    const token = generateFreshAuthToken();
    bcrypt.hash(token, 10, (b_err: any, hash: any) => {
        if (b_err) {
            if (callback) {
                return callback(b_err);
            }
            console.log(b_err);
        } else {
            fs.writeFile('users/' + id + '.auth', hash + '\n' + Date.now(), (write_err: any) => {
                if (write_err) {
                    if (callback) {
                        return callback(write_err);
                    }
                    console.log(write_err);
                } else {
                    return callback(null, token);
                }
            });
        }
    });
}

export function validateUserByIdAndPass(id: string, pass: string, callback: any) {
    fs.readFile('users/' + id + '.hash', (read_err: any, data: any) => {
        if (read_err) {
            return callback(read_err);
        }
        bcrypt.compare(pass, data + '', (b_err: any, res: boolean) => {
            if (b_err) {
                return callback(b_err);
            }
            if (res) {
                return callback(null, true);
            }
            return callback(null, false);
        });
    });
}

export function validateUserByIdAndAuthToken(id: string, token: string, callback: any) {
    fs.readFile('users/' + id + '.auth', (read_err: any, data: any) => {
        if (read_err) {
            return callback(read_err, false);
        }
        const sd = ('' + data).split('\n');
        const hash = sd[0];
        const date = sd[1];
        if (Date.now() - Number(date) > 1000 * 60 * 60 * 24 * 3) {
            callback(null, false); // Invalidate after 3 days
        }
        bcrypt.compare(token, hash, (b_err: any, res: boolean) => {
            if (b_err) {
                return callback(b_err);
            }
            if (res) {
                return callback(null, true);
            }
            return callback(null, false);
        });
    });
}
