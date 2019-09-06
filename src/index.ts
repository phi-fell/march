import { Instance } from "./instance";

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
var app = express();

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

app.use('/js', express.static(path.resolve(__dirname + '/../site/js')));
app.use('/tex', express.static(path.resolve(__dirname + '/../site/tex')));
//app.use(express.static(path.resolve(__dirname + '/public'));

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