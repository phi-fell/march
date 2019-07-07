USE_HTTPS = true;

process.argv.forEach(function (val, index, array) {
  if (val === '-NO_HTTPS') {
    USE_HTTPS = false;
  }
});

var fs = require('fs');
var express = require('express');
var app = express();

var https = undefined;
var http = undefined;
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

  redirectapp.get('*', function (req, res) {
    res.redirect('https://' + req.headers.host + req.url);
  })
  http.listen(80);
} else {
  http = require('http').createServer(app);
  io = require('socket.io')(http);
}


app.use('/js', express.static(__dirname + '/js'));
//app.use(express.static(__dirname + '/public'));

app.use('/.well-known/acme-challenge/TOgS3c1XY9f83mg4_z3huaKmiIy3R_Y_io5p7T3v2Fk', express.static(__dirname + '/challenge'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

var gameServer = require('./serverjs/server.js');
gameServer.initialize(io);

var version = require('./serverjs/version');

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