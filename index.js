var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');

app.use('/js', express.static(__dirname + '/js'));
//app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

wordList = [];
fs.readFile("res/words.txt", function (err, data) {
  if (err) throw err;
  wordList = (data + '').split('\n');
})

gameBoard = [];
for (var i = 0; i < 10; i++) {
  gameBoard[i] = [];
  for (var j = 0; j < 10; j++) {
    gameBoard[i][j] = undefined;
  }
}

clientData = [];
function addClientData(id) {
  genName = wordList[Math.floor(Math.random() * wordList.length)];
  while (getClientIdFromName(genName) !== undefined) {
    genName = wordList[Math.floor(Math.random() * wordList.length)];
  }
  posX = Math.floor(Math.random() * gameBoard.length)
  posY = Math.floor(Math.random() * gameBoard[0].length)
  while (gameBoard[posX][posY] !== undefined) {
    posX = Math.floor(Math.random() * gameBoard.length)
    posY = Math.floor(Math.random() * gameBoard[0].length)
  }
  data = { 'id': id, 'name': genName, 'x': posX, 'y': posY };
  gameBoard[posX][posY] = data;
  clientData[id] = data;
}
function removeClientData(id) {
  gameBoard[clientData[id].x][clientData[id].y] = undefined;
  delete clientData[id];
}
function getClientIdFromName(name) {
  return Object.keys(clientData).find(key => clientData[key].name === name);
}

function flushBoard() {
  io.emit('board', gameBoard);
}

io.on('connection', function (socket) {
  addClientData(socket.id);
  console.log('Connected {Name: ' + clientData[socket.id].name + ', id: ' + socket.id + ", address: " + socket.handshake.address + "}");
  socket.emit('chat message', "Welcome to the server, you have been assigned the designation '" + clientData[socket.id].name + "'");
  socket.broadcast.emit('chat message', clientData[socket.id].name + ' connected')
  socket.on('disconnect', function () {
    console.log(clientData[socket.id].name + ' disconnected');
    io.emit('chat message', clientData[socket.id].name + ' disconnected')
    removeClientData(socket.id);
    flushBoard();
  });
  socket.on('ping_cmd', function (msg) {
    console.log('ping from ' + clientData[socket.id].name);
    socket.emit('pong_cmd', msg);
  });
  socket.on('chat message', function (msg) {
    console.log(clientData[socket.id].name + "> " + msg);
    io.emit('chat message', clientData[socket.id].name + "> " + msg);
  });
  socket.on('command', function (msg) {
    console.log(clientData[socket.id].name + " requests command /" + msg.cmd + " with arguments [" + msg.tok.join(' ') + "]")
    switch (msg.cmd) {
      case "name":
        newName = msg.tok.join(' ');
        socket.broadcast.emit('chat message', clientData[socket.id].name + " has changed their name to " + newName);
        clientData[socket.id].name = newName;
        socket.emit('chat message', "you have changed your name to " + newName)
        flushBoard();
        break;
      case "whisper":
        if (msg.tok.length < 1) {
          socket.emit('chat message', "Please enter a user to whisper to")
        } else {
          recipient = getClientIdFromName(msg.tok[0]);
          if (recipient === undefined) {
            socket.emit('chat message', "Could not find user " + msg.tok[0])
          } else {
            socket.emit('chat message', "@" + msg.tok[0] + " << " + msg.tok.slice(1).join(' '));
            io.to(getClientIdFromName(msg.tok[0])).emit('chat message', clientData[socket.id].name + " whispered: " + msg.tok.slice(1).join(' '));
          }
        }
        break;
      case "move":
        if (msg.tok.length < 1) {
          socket.emit('chat message', "Please enter a direction (up, down, left, right");
        } else {
          posX = clientData[socket.id].x;
          posY = clientData[socket.id].y;
          nPosX = posX;
          nPosY = posY;
          switch (msg.tok[0]) {
            case "up":
            case "north":
              nPosY--;
              break;
            case "down":
            case "south":
              nPosY++;
              break;
            case "left":
            case "west":
              nPosX--;
              break;
            case "right":
            case "east":
              nPosX++;
              break;
            default:
              socket.emit('chat message', 'please pick a valid direction(up, down, left, right, north, south, west, east)');
              break;
          }
          if (nPosX >= 0 && nPosX < gameBoard.length && nPosY >= 0 && nPosY < gameBoard[0].length && gameBoard[nPosX][nPosY] === undefined) {
            gameBoard[nPosX][nPosY] = gameBoard[posX][posY];
            gameBoard[posX][posY] = undefined;
            clientData[socket.id].x = nPosX;
            clientData[socket.id].y = nPosY;
            flushBoard();
          }
        }
        break;
      default:
        socket.emit('chat message', 'command not recognized: /' + msg.cmd)
        break;
    }
  });
  socket.on("player_action", function (msg) {
    switch (msg + '') {
      case "move_up":
        posX = clientData[socket.id].x;
        posY = clientData[socket.id].y;
        nPosX = posX;
        nPosY = posY - 1;
        if (nPosX >= 0 && nPosX < gameBoard.length && nPosY >= 0 && nPosY < gameBoard[0].length && gameBoard[nPosX][nPosY] === undefined) {
          gameBoard[nPosX][nPosY] = gameBoard[posX][posY];
          gameBoard[posX][posY] = undefined;
          clientData[socket.id].x = nPosX;
          clientData[socket.id].y = nPosY;
          flushBoard();
        }
        break;
      case "move_left":
        posX = clientData[socket.id].x;
        posY = clientData[socket.id].y;
        nPosX = posX - 1;
        nPosY = posY;
        if (nPosX >= 0 && nPosX < gameBoard.length && nPosY >= 0 && nPosY < gameBoard[0].length && gameBoard[nPosX][nPosY] === undefined) {
          gameBoard[nPosX][nPosY] = gameBoard[posX][posY];
          gameBoard[posX][posY] = undefined;
          clientData[socket.id].x = nPosX;
          clientData[socket.id].y = nPosY;
          flushBoard();
        }
        break;
      case "move_down":
        posX = clientData[socket.id].x;
        posY = clientData[socket.id].y;
        nPosX = posX;
        nPosY = posY + 1;
        if (nPosX >= 0 && nPosX < gameBoard.length && nPosY >= 0 && nPosY < gameBoard[0].length && gameBoard[nPosX][nPosY] === undefined) {
          gameBoard[nPosX][nPosY] = gameBoard[posX][posY];
          gameBoard[posX][posY] = undefined;
          clientData[socket.id].x = nPosX;
          clientData[socket.id].y = nPosY;
          flushBoard();
        }
        break;
      case "move_right":
        posX = clientData[socket.id].x;
        posY = clientData[socket.id].y;
        nPosX = posX + 1;
        nPosY = posY;
        if (nPosX >= 0 && nPosX < gameBoard.length && nPosY >= 0 && nPosY < gameBoard[0].length && gameBoard[nPosX][nPosY] === undefined) {
          gameBoard[nPosX][nPosY] = gameBoard[posX][posY];
          gameBoard[posX][posY] = undefined;
          clientData[socket.id].x = nPosX;
          clientData[socket.id].y = nPosY;
          flushBoard();
        }
        break;
      default:
        socket.emit('log', 'unknown action: ' + msg)
        break;
    }
  });
  flushBoard();
});

http.listen(80, function () {
  console.log('listening on *:80');
});