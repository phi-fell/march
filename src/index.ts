import { Instance } from './instance';

let USE_HTTPS = true;
let PUBLISH_DIAGNOSTIC_DATA = false;

process.argv.forEach((val, index, array) => {
    if (val === '-NO_HTTPS') {
        USE_HTTPS = false;
    } else if (val === '-PUBLISH_DIAGNOSTIC_DATA') {
        PUBLISH_DIAGNOSTIC_DATA = true;
    }
});

import cookieParser = require('cookie-parser');
import express = require('express');
import fs = require('fs');
import http = require('http');
import https = require('https');
import path = require('path');
import pug from 'pug';
import socketIO = require('socket.io');
import { ATTRIBUTE } from './character/characterattributes';
import { SKILL } from './character/characterskills';
import { Server } from './server';
import { getLoadedUserByName, loadUserByName, validateCredentialsByAuthToken } from './user';
import version = require('./version');

const app = express();
app.use(cookieParser());

let https_server: any;
let http_server: any;
let redirectapp: any;
let io;

if (USE_HTTPS) {
    const options = {
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

if (PUBLISH_DIAGNOSTIC_DATA) {
    /*const diagnostic_page = pug.compileFile(path.resolve(__dirname + '/../site/pug/diagnostic.pug'));
    app.get('/diagnostic', (req: any, res: any) => {
      res.send(diagnostic_page({
        'instances': Instance.instances,
      }));
    });*/
    app.get('/diagnostic', (req: any, res: any) => {
        res.send(pug.renderFile(path.resolve(__dirname + '/../site/pug/diagnostic/main.pug'), {
            'instances': Instance.instances,
        }));
    });
    app.get('/diagnostic/instance', (req: any, res: any) => {
        if (req.query.id) {
            const inst = Instance.getLoadedInstanceById(req.query.id);
            if (inst) {
                res.send(pug.renderFile(path.resolve(__dirname + '/../site/pug/diagnostic/instance.pug'), {
                    'instance': inst,
                }));
            } else {
                res.send('No such instance!');
            }

        } else {
            res.send(pug.renderFile(path.resolve(__dirname + '/../site/pug/diagnostic/instances.pug'), {
                'instances': Instance.instances,
            }));
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
                    'will': 100,
                    'attributes': Object.keys(ATTRIBUTE).filter((attr) => typeof ATTRIBUTE[attr as any] === 'number'),
                    'skills': Object.keys(SKILL).filter((attr) => typeof SKILL[attr as any] === 'number'),
                }));
            });
        });
    } else {
        res.redirect('/login');
    }
});

app.post('/character_creation', (req: any, res: any) => {
    if (req.cookies.user && req.cookies.auth) {
        res.send(req.cookies.user + ': ' + req.cookies.auth);
        /*res.send(pug.renderFile(path.resolve(__dirname + '/../site/pug/character_creation.pug'), {
          'sheet': Instance.instances,
        }));*/
        /*
        // (within User):
            this.player = Player.createPlayer();
            this.playerid = this.player.id;
            if (this.online) {
                this.player.setActive(this);
            }
            this.saveToDisk();
        */
    } else {
        res.redirect('/');
    }
});

app.use('/js', express.static(path.resolve(__dirname + '/../site/js')));
app.use('/tex', express.static(path.resolve(__dirname + '/../site/tex')));
app.use(express.static(path.resolve(__dirname + '/../public')));

Server.initialize(io);
Server.updateLoop();

if (USE_HTTPS) {
    https_server.listen(443, () => {
        console.log('GotG V' + version.version + ' Launch_ID[' + version.launch_id + ']');
        console.log('listening on *:443');
    });
} else {
    http_server.listen(80, () => {
        console.log('GotG V' + version.version + ' Launch_ID[' + version.launch_id + ']');
        console.log('listening on *:80');
    });
}
