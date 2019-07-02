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
    socket.on('board', function (msg) {
        game.board = msg;
        game.draw();
    });
    socket.on('sheet', function (msg) {
        var list = $("#sheet");
        list.empty();
        list.append($('<li>').text('Body:'));
        list.append($('<li>').text(' - Strength: ' + msg.BOD.STR));
        list.append($('<li>').text(' - Endurance: ' + msg.BOD.END));
        list.append($('<li>').text(' - Constitution: ' + msg.BOD.CON));
        list.append($('<li>').text('Movement:'));
        list.append($('<li>').text(' - Agility: ' + msg.MOV.AGI));
        list.append($('<li>').text(' - Dexterity: ' + msg.MOV.DEX));
        list.append($('<li>').text(' - Speed: ' + msg.MOV.SPD));
        list.append($('<li>').text('Mental:'));
        list.append($('<li>').text(' - Charisma: ' + msg.MNT.CHA));
        list.append($('<li>').text(' - Logic: ' + msg.MNT.LOG));
        list.append($('<li>').text(' - Wisdom: ' + msg.MNT.WIS));
        list.append($('<li>').text('Other:'));
        list.append($('<li>').text(' - Memory: ' + msg.OTH.MEM));
        list.append($('<li>').text(' - Will: ' + msg.OTH.WIL));
        list.append($('<li>').text(' - Luck: ' + msg.OTH.LCK));
        list.append($('<li>').text('Mana:'));
        list.append($('<li>').text(' - Capacity: ' + msg.MNA.CAP));
        list.append($('<li>').text(' - Conductivity: ' + msg.MNA.CND));
        list.append($('<li>').text(' - Generation: ' + msg.MNA.GEN));
        list.append($('<li>').text('Faith:'));
        list.append($('<li>').text(' - Conviction: ' + msg.FTH.CVN));
        list.append($('<li>').text(' - Piety: ' + msg.FTH.PTY));
        list.append($('<li>').text(' - Favour: ' + msg.FTH.FVR));
    });
    socket.on('status', function (msg) {
        var list = $("#status");
        list.empty();
        list.append($('<li>').text('-----Status-----'));
        list.append($('<li>').text('Position: (' + msg.x + ', ' + msg.y + ")"));
        list.append($('<li>').text('Health: ' + msg.hp + '/' + msg.max_hp));
        list.append($('<li>').text('Stamina: ' + msg.sp + ' / ' + msg.max_sp));
    });
    socket.on('info', function (msg) {
        var list = $("#info");
        list.empty();
        list.append($('<li>').text('User: ' + msg.name));
        list.append($('<li>').text('Address: ' + msg.address.substring(7)));
    });
    socket.on('log', function (msg) {
        console.log(msg);
    });
    socket.on('force_disconnect',function(msg){
        socket.disconnect();
        $('#messages').append($('<li>').text(msg));
    });
});