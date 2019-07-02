var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');
var commands = require('./serverjs/commands')(io);
var game = require('./serverjs/game')(io);

app.use('/js', express.static(__dirname + '/js'));
//app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  game.addClientData(socket);
  game.updateClient(socket.id);
  console.log('Connected {Name: ' + clientData[socket.id].info.name + ', id: ' + socket.id + ", address: " + socket.handshake.address + "}");
  socket.emit('chat message', "Welcome to the server, you have been assigned the designation '" + clientData[socket.id].info.name + "'");
  socket.broadcast.emit('chat message', clientData[socket.id].info.name + ' connected')
  socket.on('disconnect', function () {
    console.log(clientData[socket.id].info.name + ' disconnected');
    io.emit('chat message', clientData[socket.id].info.name + ' disconnected')
    game.removeClientData(socket.id);
    game.flushBoard();
  });
  socket.on('ping_cmd', function (msg) {
    console.log('ping from ' + clientData[socket.id].info.name);
    socket.emit('pong_cmd', msg);
  });
  socket.on('chat message', function (msg) {
    console.log(clientData[socket.id].info.name + "> " + msg);
    io.emit('chat message', clientData[socket.id].info.name + "> " + msg);
  });
  socket.on('command', function (msg) {
    console.log(clientData[socket.id].info.name + " requests command /" + msg.cmd + " with arguments [" + msg.tok.join(' ') + "]")
    commands.execute(game, socket, msg.cmd, msg.tok);
    game.updateClient(socket.id);
  });
  socket.on("player_action", function (msg) {
    switch (msg + '') {
      case "move_up":
        posX = clientData[socket.id].status.x;
        posY = clientData[socket.id].status.y;
        nPosX = posX;
        nPosY = posY - 1;
        if (nPosX >= 0 && nPosX < game.board.length && nPosY >= 0 && nPosY < game.board[0].length && game.board[nPosX][nPosY] === undefined) {
          game.board[nPosX][nPosY] = game.board[posX][posY];
          game.board[posX][posY] = undefined;
          clientData[socket.id].status.x = nPosX;
          clientData[socket.id].status.y = nPosY;
          game.flushBoard();
          game.updateClient(socket.id);
        }
        break;
      case "move_left":
        posX = clientData[socket.id].status.x;
        posY = clientData[socket.id].status.y;
        nPosX = posX - 1;
        nPosY = posY;
        if (nPosX >= 0 && nPosX < game.board.length && nPosY >= 0 && nPosY < game.board[0].length && game.board[nPosX][nPosY] === undefined) {
          game.board[nPosX][nPosY] = game.board[posX][posY];
          game.board[posX][posY] = undefined;
          clientData[socket.id].status.x = nPosX;
          clientData[socket.id].status.y = nPosY;
          game.flushBoard();
          game.updateClient(socket.id);
        }
        break;
      case "move_down":
        posX = clientData[socket.id].status.x;
        posY = clientData[socket.id].status.y;
        nPosX = posX;
        nPosY = posY + 1;
        if (nPosX >= 0 && nPosX < game.board.length && nPosY >= 0 && nPosY < game.board[0].length && game.board[nPosX][nPosY] === undefined) {
          game.board[nPosX][nPosY] = game.board[posX][posY];
          game.board[posX][posY] = undefined;
          clientData[socket.id].status.x = nPosX;
          clientData[socket.id].status.y = nPosY;
          game.flushBoard();
          game.updateClient(socket.id);
        }
        break;
      case "move_right":
        posX = clientData[socket.id].status.x;
        posY = clientData[socket.id].status.y;
        nPosX = posX + 1;
        nPosY = posY;
        if (nPosX >= 0 && nPosX < game.board.length && nPosY >= 0 && nPosY < game.board[0].length && game.board[nPosX][nPosY] === undefined) {
          game.board[nPosX][nPosY] = game.board[posX][posY];
          game.board[posX][posY] = undefined;
          clientData[socket.id].status.x = nPosX;
          clientData[socket.id].status.y = nPosY;
          game.flushBoard();
          game.updateClient(socket.id);
        }
        break;
      default:
        socket.emit('log', 'unknown action: ' + msg)
        break;
    }
  });
  game.flushBoard();
  game.updateClient(socket.id);
});

http.listen(80, function () {
  console.log('listening on *:80');
});