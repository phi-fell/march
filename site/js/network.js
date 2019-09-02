var socket = undefined;
var messageHistory = [];
var historyPos = 0;
var currentCache = "";

function levelUpAttr(val) {
    socket.emit('levelup', {
        'type': 'attribute',
        'attr': val,
    });
}

$(function () {
    creds = loadCredentials();
    if (creds.user && creds.auth) {
        socket = io();
        console.log('logging in as ' + creds.user);
        socket.emit('login', creds);
        socket.on('success', function (msg) {
            console.log('valid credentials, logged in!');
        });
        socket.on('fail', function (msg) {
            console.log('invalid credentials, redirecting to /login');
            window.location.href = '/login';
        });
    } else {
        //TODO: guest login?
        console.log('no stored credentials, redirecting to /login');
        window.location.href = '/login';
    }
    $('form').submit(function (e) {
        e.preventDefault(); // prevents page reloading
        msg = $('#m').val();
        messageHistory.push(msg);
        historyPos = messageHistory.length;
        currentCache = "";
        if ((msg + '') == '/ping') {
            socket.emit('ping_cmd', Date.now());
        } else if ((msg + '') == '/logout') {
            clearCredentials();
            window.location.href = '/';
        } else if ((msg + '').startsWith('/sheet')) {
            tok = msg.substring(1).split(' ');
            cmd = tok[0];
            tok = tok.slice(1);
            game._sheetdisplaymode = tok.join(' ');
            game.updateMenus();
        } else if ((msg + '').startsWith('/')) {
            tok = msg.substring(1).split(' ');
            cmd = tok[0];
            tok = tok.slice(1);
            socket.emit('command', {
                'cmd': cmd,
                'tok': tok,
            })
        } else {
            socket.emit('chat message', msg);
        }
        $('#m').val('');
        $('#m').blur();
        return false;
    });
    socket.on('chat message', function (msg) {
        if (Math.ceil($('#chat_history').scrollTop() + $('#chat_history').innerHeight()) >= $('#chat_history')[0].scrollHeight) {
            $('#messages').append($('<li>').text(msg));
            $('#chat_history').scrollTop($('#chat_history')[0].scrollHeight);
        } else {
            $('#messages').append($('<li>').text(msg));
        }
    });
    socket.on('pong_cmd', function (msg) {
        $('#messages').append($('<li>').text('pong! ' + (Date.now() - msg) + 'ms'));
    });
    socket.on('update', function (msg) {
        game.mobs = msg.mobs;
        game.tiles = msg.tiles;
        game.boardInfo = msg.board_info;
        game.player = msg.player;
        game.draw();
        game.updateMenus();
    });
    socket.on('log', function (msg) {
        console.log(msg);
    });
    socket.on('force_disconnect', function (msg) {
        socket.disconnect();
        $('#messages').append($('<li>').text(msg));
    });
});