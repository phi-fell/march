import { Instance } from './instance';

let USE_HTTPS = true;
let PUBLISH_DIAGNOSTIC_DATA = false

process.argv.forEach((val, index, array) => {
    if (val === '-NO_HTTPS') {
        USE_HTTPS = false;
    } else if (val === '-PUBLISH_DIAGNOSTIC_DATA') {
        PUBLISH_DIAGNOSTIC_DATA = true;
    }
});

var fs = require('fs');
var path = require('path');
var express = require('express');
const pug = require('pug');
import cookieParser = require('cookie-parser');
import { validateCredentialsByAuthToken, getLoadedUserByName, loadUserByName } from './user';
import { ATTRIBUTE } from './character/characterattributes';
import { SKILL } from './character/characterskills';

var app = express();
app.use(cookieParser());

var https: any = undefined;
var http: any = undefined;
var io = undefined;

if (USE_HTTPS) {
    var options = {
        key: fs.readFileSync('/etc/letsencrypt/live/gotg.phi.ac/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/gotg.phi.ac/cert.pem'),
    };

    https = require('https').createServer(options, app);
    io = require('socket.io')(https);

    var redirectapp = express();
    http = require('http').createServer(redirectapp);

    redirectapp.get('*', function (req: any, res: any) {
        res.redirect('https://' + req.headers.host + req.url);
    })
    http.listen(80);
} else {
    http = require('http').createServer(app);
    io = require('socket.io')(http);
}

app.get('/', function (req: any, res: any) {
    res.sendFile(path.resolve(__dirname + '/../site/html/index.html'));
});

app.get('/favicon.ico', function (req: any, res: any) {
    res.sendFile(path.resolve(__dirname + '/../site/logo/favicon.ico'));
});

app.get('/game', function (req: any, res: any) {
    res.sendFile(path.resolve(__dirname + '/../site/html/game.html'));
});

app.get('/login', function (req: any, res: any) {
    res.sendFile(path.resolve(__dirname + '/../site/html/login.html'));
});

app.get('/create', function (req: any, res: any) {
    res.sendFile(path.resolve(__dirname + '/../site/html/new.html'));
});

if (PUBLISH_DIAGNOSTIC_DATA) {
    /*const diagnostic_page = pug.compileFile(path.resolve(__dirname + '/../site/pug/diagnostic.pug'));
    app.get('/diagnostic', function (req: any, res: any) {
      res.send(diagnostic_page({
        'instances': Instance.instances,
      }));
    });*/
    app.get('/diagnostic', (req: any, res: any) => {
        res.send(pug.renderFile(path.resolve(__dirname + '/../site/pug/diagnostic/main.pug'), {
            'instances': Instance.instances,
        }));
    });
    app.get('/diagnostic/instance', function (req: any, res: any) {
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
        validateCredentialsByAuthToken(req.cookies.user, req.cookies.auth, (err, valid) => {
            if (err || !valid) {
                return res.redirect('/login');
            }
            if (getLoadedUserByName(req.cookies.user)) {
                return res.send('You are already logged in on a different window or device.');
            }
            loadUserByName(req.cookies.user, (err, user) => {
                if (err) {
                    console.log(err);
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
app.use('/public', express.static(path.resolve(__dirname + '/../public')));

var gameServer = require('./server.js');
gameServer.initialize(io);

var version = require('./version');

if (USE_HTTPS) {
    https.listen(443, function () {
        console.log('GotG V' + version.version + ' Launch_ID[' + version.launch_id + ']');
        console.log('listening on *:443');
    });
} else {
    http.listen(80, function () {
        console.log('GotG V' + version.version + ' Launch_ID[' + version.launch_id + ']');
        console.log('listening on *:80');
    });
}