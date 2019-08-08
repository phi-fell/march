(function () {
    var fs = require('fs');
    const bcrypt = require('bcrypt');
    var uuid = require('uuid/v4');
    function generateNewUserPassword() {
        return uuid();
    }
    function generateFreshAuthToken() {
        return uuid();
    }
    function createUserAndGetPass(id: string) {
        var pass = generateNewUserPassword();
        setUserPass(id, pass);
        return pass;
    }
    function setUserPass(id: string, pass: string) {
        bcrypt.hash(pass, 10, function (err: any, hash: any) {
            if (err) {
                console.log(err);
            } else {
                fs.writeFile("users/" + id + '.hash', hash, function (err: any) {
                    if (err) {
                        console.log(err);
                    }
                });
            }
        });
    }
    function setUserIdByName(id: string, name: string, callback: any) {
        fs.writeFile("users/" + name + '.id', id + '\n' + name, function (err: any) {
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
        fs.readFile("users/" + name + '.id', function (err: any, data: any) {
            if (err) {
                return callback(err);
            } else {
                var lines = (data + '').split('\n');
                if (name === lines[1]) {
                    return callback(null, lines[0]);
                } else { 
                    return callback('User does not case-sensitively exist (or the .id file is corrupt)');
                }
            }
        });
    }
    module.exports = {
        'setUserPass': setUserPass,
        'getUserIdFromName': getUserIdFromName,
        'createUserAndGetPass': createUserAndGetPass,
    };
    module.exports.generateAndGetFreshAuthTokenForId = function (id: string, callback: any) {
        var token = generateFreshAuthToken();
        bcrypt.hash(token, 10, function (err: any, hash: any) {
            if (err) {
                callback(err);
            } else {
                fs.writeFile("users/" + id + '.auth', hash + "\n" + Date.now(), function (err: any) {
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
        fs.readFile("users/" + id + '.hash', function (err: any, data: any) {
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
        fs.readFile("users/" + id + '.auth', function (err: any, data: any) {
            if (err) {
                return callback(err, false);
            } else {
                var sd = ('' + data).split('\n');
                var hash = sd[0];
                var date = sd[1];
                if (Date.now() - parseInt(date) > 1000 * 60 * 60 * 24 * 3) {
                    callback(null, false);//Invalidate after 3 days
                }
                bcrypt.compare(token, hash, function (err: any, res: boolean) {
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
    module.exports.setUserIdByName = setUserIdByName;
}());