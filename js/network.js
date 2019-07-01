var socket = undefined;
$(function () {
    socket = io();
    $('form').submit(function (e) {
        e.preventDefault(); // prevents page reloading
        msg = $('#m').val();
        if ((msg + '') == '/ping') {
            socket.emit('ping_cmd', Date.now());
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
        if (Math.ceil($('#chat_history').scrollTop() + $('#chat_history').innerHeight())  >= $('#chat_history')[0].scrollHeight) {
            $('#messages').append($('<li>').text(msg));
            $('#chat_history').scrollTop($('#chat_history')[0].scrollHeight);
        } else {
            $('#messages').append($('<li>').text(msg));
        }
    });
    socket.on('pong_cmd', function (msg) {
        $('#messages').append($('<li>').text('pong! ' + (Date.now() - msg) + 'ms'));
    });
    socket.on('board', function (msg) {
        game.board = msg;
        game.draw();
    });
    socket.on('log', function (msg) {
        console.log(msg);
    });
});