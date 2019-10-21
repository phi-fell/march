import childProcess = require('child_process');
import cookieParser = require('cookie-parser');
import express = require('express');
import fs = require('fs');
import http = require('http');
import https = require('https');
import path = require('path');
import pug from 'pug';
import socketIO = require('socket.io');

import { ATTRIBUTE } from './character/characterattributes';
import { CharacterRace } from './character/characterrace';
import { CharacterSheet } from './character/charactersheet';
import { SKILL } from './character/characterskills';
import { CharacterTrait } from './character/charactertrait';
import { Instance } from './instance';
import { generateName } from './namegen';
import { Player } from './player';
import { Server } from './server';
import { executeCmd } from './terminal';
import { getLoadedUserByName, loadUserByName, User, validateCredentialsByAuthToken } from './user';
import { launch_id, version } from './version';

let USE_HTTPS = true;
let PUBLISH_DIAGNOSTIC_DATA = false;

process.argv.forEach((val, index, array) => {
    if (val === '-NO_HTTPS') {
        USE_HTTPS = false;
    } else if (val === '-PUBLISH_DIAGNOSTIC_DATA') {
        PUBLISH_DIAGNOSTIC_DATA = true;
    }
});

const app = express();
app.use(cookieParser());
app.use(express.json());

let https_server: any;
let http_server: any;
let redirectapp: any;
let io;

function validateAdminToken(token) {
    return token && token.match(/^[0-9a-zA-Z]+$/); // TODO: admin credentials
}

if (USE_HTTPS) {
    const options = { // TODO: make certificate path variable?
        'key': fs.readFileSync('/etc/letsencrypt/live/gotg.phi.ac/privkey.pem'),
        'cert': fs.readFileSync('/etc/letsencrypt/live/gotg.phi.ac/cert.pem'),
    };

    https_server = https.createServer(options, app);
    io = socketIO(https_server);

    redirectapp = express();
    http_server = http.createServer(redirectapp);

    redirectapp.get('*', (req: any, res: any) => {
        res.redirect('https://' + req.headers.host + req.url);
    });
    http_server.listen(80);
} else {
    http_server = http.createServer(app);
    io = socketIO(http_server);
}

app.get('/', (req: any, res: any) => {
    res.sendFile(path.resolve(__dirname + '/../site/html/index.html'));
});

app.get('/favicon.ico', (req: any, res: any) => {
    res.sendFile(path.resolve(__dirname + '/../site/logo/favicon.ico'));
});

app.get('/game', (req: any, res: any) => {
    res.sendFile(path.resolve(__dirname + '/../site/html/game.html'));
});

app.get('/login', (req: any, res: any) => {
    res.sendFile(path.resolve(__dirname + '/../site/html/login.html'));
});

app.get('/create', (req: any, res: any) => {
    res.sendFile(path.resolve(__dirname + '/../site/html/new.html'));
});

app.get('/terminal', (req: any, res: any, next: any) => {
    if (validateAdminToken(req.cookies.admin_token)) {
        res.sendFile(path.resolve(__dirname + '/../site/html/terminal.html'));
    } else {
        next();
    }
});
app.get('/cmd', (req: any, res: any, next: any) => {
    if (validateAdminToken(req.cookies.admin_token)) {
        res.sendFile(path.resolve(__dirname + '/../site/html/terminal.html'));
    } else {
        next();
    }
});
app.post('/terminal', (req: any, res: any, next: any) => {
    if (validateAdminToken(req.cookies.admin_token)) {
        res.send({
            'result': executeCmd(req.body.cmd),
        });
    } else {
        next();
    }
});

function execute(command, callback) {
    childProcess.exec(command, (error, stdout, stderr) => { callback(stdout); });
}

function execDetached(command) {
    childProcess.spawn(command, [], {
        'shell': true,
        'detached': true,
        'stdio': 'ignore',
    });
}

app.get('/version', (req: any, res: any, next: any) => {
    if (validateAdminToken(req.cookies.admin_token)) {
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
            res.send(pug.renderFile(path.resolve(__dirname + '/../site/pug/version.pug'), {
                'versions': versions,
                'current': version,
            }));
        });
    } else {
        next();
    }
});

app.post('/version', (req: any, res: any, next: any) => {
    if (validateAdminToken(req.cookies.admin_token)) {
        console.log('git checkout ' + req.body.hash);
        execute('git checkout ' + req.body.hash, (ch_output) => {
            console.log(ch_output);
            console.log('npm run build');
            execute('npm run build', (b_output) => {
                console.log(b_output);
                console.log('git checkout master');
                execDetached('sleep 5 && git checkout master');
                console.log('Restarting...');
                res.send({
                    'status': 'success',
                });
                execute('touch nodemon/restart.js', (output) => { /* ignore */ });
            });
        });
    } else {
        next();
    }
});

if (PUBLISH_DIAGNOSTIC_DATA) {
    /*const diagnostic_page = pug.compileFile(path.resolve(__dirname + '/../site/pug/diagnostic.pug'));
    app.get('/diagnostic', (req: any, res: any) => {
      res.send(diagnostic_page({
        'instances': Instance.instances,
      }));
    });*/
    app.get('/diagnostic', (req: any, res: any, next: any) => {
        if (validateAdminToken(req.cookies.admin_token)) {
            res.send(pug.renderFile(path.resolve(__dirname + '/../site/pug/diagnostic/main.pug'), {
                'instances': Instance.instances,
            }));
        } else {
            next();
        }
    });
    app.get('/diagnostic/instance', (req: any, res: any, next: any) => {
        if (validateAdminToken(req.cookies.admin_token)) {
            if (req.query.id) {
                const inst = Instance.getLoadedInstanceById(req.query.id);
                if (inst) {
                    res.send(pug.renderFile(path.resolve(__dirname + '/../site/pug/diagnostic/instance.pug'), {
                        'instance': inst,
                    }));
                } else {
                    next();
                }

            } else {
                res.send(pug.renderFile(path.resolve(__dirname + '/../site/pug/diagnostic/instances.pug'), {
                    'instances': Instance.instances,
                }));
            }
        } else {
            next();
        }
    });
}

app.get('/character_creation', (req: any, res: any) => {
    if (req.cookies.user && req.cookies.auth) {
        validateCredentialsByAuthToken(req.cookies.user, req.cookies.auth, (validate_err, valid) => {
            if (validate_err || !valid) {
                return res.redirect('/login');
            }
            if (getLoadedUserByName(req.cookies.user)) {
                return res.send('You are already logged in on a different window or device.');
            }
            loadUserByName(req.cookies.user, (load_err, user) => {
                if (load_err) {
                    console.log(load_err);
                    return res.send('Error: Could not load user!\n'
                        + 'This is most likely a bug.\n'
                        + 'If so, reporting it to the devs (along with any relevant info on how and when this occured) would be appreciated.');
                }
                user.unload();
                return res.send(pug.renderFile(path.resolve(__dirname + '/../site/pug/character_creation.pug'), {
                    'essence': 100,
                    'attributes': Object.keys(ATTRIBUTE).filter((attr) => typeof ATTRIBUTE[attr as any] === 'number'),
                    'skills': Object.keys(SKILL).filter((attr) => typeof SKILL[attr as any] === 'number'),
                    'races': CharacterRace.getPlayableRacesJSONString(),
                    'traits': CharacterTrait.getTraitsJSONString(),
                }));
            });
        });
    } else {
        res.redirect('/login');
    }
});

app.post('/character_creation', (req: any, res: any) => {
    if (!req.cookies.user || !req.cookies.auth) {
        res.send({
            'status': 'fail',
            // tslint:disable-next-line: max-line-length
            'alert': 'You are not logged in with valid credentials.  Please log in.  (you can try logging in in a separate window, closing that window, and then continuing from here, so as not to lose your choices)',
        });
        return;
    }
    validateCredentialsByAuthToken(req.cookies.user, req.cookies.auth, (validate_err, valid) => {
        if (validate_err || !valid) {
            res.send({
                'status': 'fail',
                // tslint:disable-next-line: max-line-length
                'alert': 'You are not logged in with valid credentials.  Please log in.  (you can try logging in in a separate window, closing that window, and then continuing from here, so as not to lose your choices)',
            });
            return;
        }
        const sheet = CharacterSheet.validateAndCreateFromJSON(req.body);
        if (sheet === null) {
            res.send({
                'status': 'fail',
                // tslint:disable-next-line: max-line-length
                'alert': 'You\'re character is not valid.  This is likely a bug, if so please contact the developer.  (or you messed with the data.  tsk tsk.  nice try)',
            });
            return;
        }
        const u: User | null = getLoadedUserByName(req.cookies.user);
        if (u) {
            if (u.player) {
                res.send({
                    'status': 'fail',
                    // tslint:disable-next-line: max-line-length
                    'alert': 'This user already has a player.',
                });
                return;
            }
            u.player = new Player(Player.generateNewPlayerID(), req.body.name || generateName());
            u.player.charSheet = sheet;
            u.playerid = u.player.id;
            u.player.saveToDisk();
            u.player.unload();
            u.saveToDisk();
            res.send({
                'status': 'success',
                'redirect': '/game',
            });
            return;
        }
        loadUserByName(req.cookies.user, (load_err, user) => {
            if (load_err) {
                console.log(load_err);
                res.send({
                    'status': 'fail',
                    // tslint:disable-next-line: max-line-length
                    'alert': 'Something went wrong.  User could not be loaded from disk.  This is likely a bug, in which case please contact the developer.',
                });
                return;
            }
            if (user.player) {
                res.send({
                    'status': 'fail',
                    // tslint:disable-next-line: max-line-length
                    'alert': 'This user already has a player.',
                });
                user.unload();
                return;
            }
            user.player = new Player(Player.generateNewPlayerID(), req.body.name || generateName());
            user.player.charSheet = sheet;
            user.playerid = user.player.id;
            user.player.saveToDisk();
            user.saveToDisk();
            res.send({
                'status': 'success',
                'redirect': '/game',
            });
            user.player.unload();
            user.unload();
            return;
        });

    });
});

app.use('/js', express.static(path.resolve(__dirname + '/../site/js')));
app.use('/tex', express.static(path.resolve(__dirname + '/../site/tex')));
app.use(express.static(path.resolve(__dirname + '/../public')));

Server.initialize(io);
Server.updateLoop();

if (USE_HTTPS) {
    https_server.listen(443, () => {
        console.log('GotG V' + version + ' Launch_ID[' + launch_id + ']');
        console.log('listening on *:443');
    });
} else {
    http_server.listen(80, () => {
        console.log('GotG V' + version + ' Launch_ID[' + launch_id + ']');
        console.log('listening on *:80');
    });
}
