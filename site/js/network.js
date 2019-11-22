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

function pickupItem(schema, count) {
    socket.emit('player_action', {
        'action': 'pickup',
        schema,
        count,
    });
}

function dropItem(schema, count) {
    socket.emit('player_action', {
        'action': 'drop',
        schema,
        count,
    });
}

function equipItem(item_id) {
    socket.emit('player_action', {
        'action': 'equip',
        item_id,
    });
}

function unequipItem(slot) {
    socket.emit('player_action', {
        'action': 'unequip',
        slot,
    });
}

function setSheetDisplayMode(dropdown) {
    game._sheetdisplaymode = dropdown.value;
    game.updateMenus();
}

function getDamageString(damage) {
    return 'DMG';
}

function printEvent(event) {
    if (!event) {
        return console.log('null event: ' + event);
    }
    switch (event.type) {
        case 'NEW_ROUND':
            addMessage('A new round has begun!');
            break;
        case 'MOVE':
            addMessage('MOVE');
            break;
        case 'ATTACK':
            addMessage(event.attacker.name + ' attacks ' + event.defender.name + (event.success ? ' dealing ' + ((event.damage && event.damage.length) ? event.damage.map(getDamageString).reduce((s, d) => s + ', ' + d) : 'no damage') : ' and misses.'));
            break;
        case 'WAIT':
            addMessage('WAIT');
            break;
        case 'BLEED':
            addMessage('BLEED');
            break;
        case 'HEAL':
            addMessage('HEAL');
            break;
        case 'PICKUP':
            addMessage('PICKUP');
            break;
        case 'DROP':
            addMessage('DROP');
            break;
        case 'DEATH':
            addMessage('DEATH');
            break;
        default:
            return console.log('unknown or invalid event type: ' + event.type)
    }
}

function addMessage(msg) {
    if (Math.ceil($('#chat_history').scrollTop() + $('#chat_history').innerHeight()) >= $('#chat_history')[0].scrollHeight) {
        $('#messages').append($('<li>').text(msg));
        $('#chat_history').scrollTop($('#chat_history')[0].scrollHeight);
    } else {
        $('#messages').append($('<li>').text(msg));
    }
}

$(function () {
    creds = loadCredentials();
    if (creds.user && creds.auth) {
        socket = io();
        socket.on('connect', () => {
            console.log('logging in as ' + creds.user);
            socket.emit('login', creds);
        });
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
        } else if ((msg + '').startsWith('/action')) {
            tok = msg.substring(1).split(' ');
            tok = tok.slice(1);
            socket.emit('player_action', { 'action': tok.join(' ') });
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
        addMessage(msg);
    });
    socket.on('event', function (msg) {
        printEvent(msg);
    });
    socket.on('pong_cmd', function (msg) {
        $('#messages').append($('<li>').text('pong! ' + (Date.now() - msg) + 'ms'));
    });
    socket.on('palette', function (msg) {
        game.loadPalette(msg);
    });
    socket.on('update', function (msg) {
        game.mobs = msg.mobs;
        game.tiles = msg.tiles;
        game.tileAdjacencies = msg.tileAdjacencies;
        game.boardInfo = msg.info;
        game.items = msg.items;
        game.itemsOnGround = msg.itemsOnGround;
        game.portals = msg.portals;
        game.player = msg.player;
        game.draw();
        game.updateMenus();
    });
    socket.on('log', function (msg) {
        console.log(msg);
    });
    socket.on('force_disconnect', function (msg) {
        socket.disconnect();
        addMessage(msg);
    });
});
