var USE_HTTPS = true;

process.argv.forEach(function (val, index, array) {
  if (val === '-NO_HTTPS') {
    USE_HTTPS = false;
  }
});

var fs = require('fs');
var path = require('path');
var express = require('express');
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

app.use('/js', express.static(path.resolve(__dirname + '/../site/js')));
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