(function () {
    var fs = require('fs');
    var io = undefined;

    wordList = [];
    fs.readFile("res/words.txt", function (err, data) {
        if (err) throw err;
        wordList = (data + '').split('\n');
    });

    board = [];
    for (var i = 0; i < 10; i++) {
        board[i] = [];
        for (var j = 0; j < 10; j++) {
            board[i][j] = undefined;
        }
    }

    function flushBoard() {
        io.emit('board', board);
    }

    clientData = [];
    function addClientData(socket) {
        genName = wordList[Math.floor(Math.random() * wordList.length)];
        while (getClientIdFromName(genName) !== undefined) {
            genName = wordList[Math.floor(Math.random() * wordList.length)];
        }
        posX = Math.floor(Math.random() * board.length)
        posY = Math.floor(Math.random() * board[0].length)
        while (board[posX][posY] !== undefined) {
            posX = Math.floor(Math.random() * board.length)
            posY = Math.floor(Math.random() * board[0].length)
        }
        var info = {
            'address': socket.handshake.address,
            'name': genName,
        }
        var status = {
            'x': posX,
            'y': posY,
            'hp': 7,
            'max_hp': 10,
            'sp': 10,
            'max_sp': 10
        }
        var sheet = {
            'BOD': {
                'STR': 1,
                'END': 2,
                'CON': 3
            }, 'MOV': {
                'AGI': 4,
                'DEX': 5,
                'SPD': 6
            }, 'MNT': {
                'CHA': 7,
                'LOG': 8,
                'WIS': 9
            }, 'OTH': {
                'MEM': 10,
                'WIL': 11,
                'LCK': 12
            }, 'MNA': {
                'CAP': 13,
                'CND': 14,
                'GEN': 15
            }, 'FTH': {
                'CVN': 16,
                'PTY': 17,
                'FVR': 18
            }
        }
        var user = { 'privilege': 'none' };
        data = { 'id': socket.id, 'user': user, 'info': info, 'status': status, 'sheet': sheet };
        board[posX][posY] = data;
        clientData[socket.id] = data;
    }
    function removeClientData(id) {
        board[clientData[id].status.x][clientData[id].status.y] = undefined;
        delete clientData[id];
    }
    function getClientIdFromName(name) {
        return Object.keys(clientData).find(key => clientData[key].info.name === name);
    }

    function updateClient(id) {
        io.to(id).emit('sheet', clientData[id].sheet);
        io.to(id).emit('status', clientData[id].status);
        io.to(id).emit('info', clientData[id].info);
    }

    module.exports = function (ioModule) {
        io = ioModule;
        return {
            'board': board,
            'flushBoard': flushBoard,
            'clientData': clientData,
            'addClientData': addClientData,
            'removeClientData': removeClientData,
            'getClientIdFromName': getClientIdFromName,
            'updateClient': updateClient
        };
    }
}());