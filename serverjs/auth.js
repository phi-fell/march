(function () {
    var fs = require('fs');
    const bcrypt = require('bcrypt');
    var uuid = require('uuid/v4');
    function generateNewUserPassword() {
        return uuid();
    }
    function createUserAndGetPass(id) {
        var pass = generateNewUserPassword();
        setUserPass(id, pass);
        return pass;
    }
    function setUserPass(id, pass) {
        bcrypt.hash(pass, 10, function (err, hash) {
            if (err) {
                console.log(err);
            } else {
                fs.writeFile("users/" + id + '.hash', hash, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
            }
        });
    }
    function validateUserById(id, pass, callback) {
        fs.readFile("users/" + id + '.hash', function (err, data) {
            if (err) {
                return callback(err);
            } else {
                bcrypt.compare(pass, data + '', function (err, res) {
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
    function setUserIdByName(id, name, callback) {
        fs.writeFile("users/" + name + '.id', id, function (err) {
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
    function deleteUserIdByName(name, callback) {
        if (!callback) {
            callback = function (err) {
                if (err) {
                    console.log(err);
                }
            };
        }
        fs.unlink('users/' + name + '.id', callback);
    }
    function renameUser(name, newName, callback) {
        if (!callback) {
            callback = function (err) {
                if (err) {
                    console.log(err);
                }
            };
        }
        fs.rename('users/' + name + '.id', 'users/' + newName + '.id', callback);
    }
    function getUserIdFromName(name, callback) {
        fs.readFile("users/" + name + '.id', function (err, data) {
            if (err) {
                return callback(err);
            } else {
                return callback(null, data + '');
            }
        });
    }
    module.exports = {
        'setUserPass': setUserPass,
        'validateUserById': validateUserById,
        'getUserIdFromName': getUserIdFromName,
        'createUserAndGetPass': createUserAndGetPass,
    };
    module.exports.setUserIdByName = setUserIdByName;
    module.exports.deleteUserIdByName = deleteUserIdByName;
    module.exports.renameUser = renameUser;
}());