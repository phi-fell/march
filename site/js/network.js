var socket = undefined;
var messageHistory = [];
var historyPos = 0;
var currentCache = "";
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
        game.board = msg.board;
        game.player = msg.player;
        game.draw();
        var sheet = msg.player.sheet;
        var status = msg.player.status;
        var list = $("#sheet");
        list.empty();
        list.append($('<li>').text('Body:'));
        list.append($('<li>').text(' - Strength: ' + sheet.attributes.STRENGTH));
        list.append($('<li>').text(' - Endurance: ' + sheet.attributes.ENDURANCE));
        list.append($('<li>').text(' - Constitution: ' + sheet.attributes.CONSTITUTION));
        list.append($('<li>').text('Movement:'));
        list.append($('<li>').text(' - Agility: ' + sheet.attributes.AGILITY));
        list.append($('<li>').text(' - Dexterity: ' + sheet.attributes.DEXTERITY));
        list.append($('<li>').text(' - Speed: ' + sheet.attributes.SPEED));
        list.append($('<li>').text('Mental:'));
        list.append($('<li>').text(' - Charisma: ' + sheet.attributes.CHARISMA));
        list.append($('<li>').text(' - Logic: ' + sheet.attributes.LOGIC));
        list.append($('<li>').text(' - Wisdom: ' + sheet.attributes.WISDOM));
        list.append($('<li>').text('Other:'));
        list.append($('<li>').text(' - Memory: ' + sheet.attributes.MEMORY));
        list.append($('<li>').text(' - Will: ' + sheet.attributes.WILLPOWER));
        list.append($('<li>').text(' - Luck: ' + sheet.attributes.LUCK));

        var list = $("#status");
        list.empty();
        list.append($('<li>').text('-----Status-----'));
        list.append($('<li>').text('Position: (' + msg.player.location.x + ', ' + msg.player.location.y + ")"));
        list.append($('<li>').text('Health: ' + status.hp + '/' + status.max_hp));
        list.append($('<li>').text('Stamina: ' + status.sp + '/' + status.max_sp));
        list.append($('<li>').text('Action Points: ' + status.ap + '/' + status.max_ap + ' (+' + status.ap_recovery + ' /turn)'));

        var list = $("#info");
        list.empty();
        list.append($('<li>').text('Player: ' + msg.player.name));
        list.append($('<li>').text('Origin: ' + sheet.origin.type));
    });
    socket.on('log', function (msg) {
        console.log(msg);
    });
    socket.on('force_disconnect', function (msg) {
        socket.disconnect();
        $('#messages').append($('<li>').text(msg));
    });
});