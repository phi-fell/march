var KEY_MAP = {
    13: 'chat',
    37: 'turn_left',
    38: 'turn_down',
    39: 'turn_right',
    40: 'turn_up',
    87: 'move_up',
    65: 'move_left',
    83: 'move_down',
    68: 'move_right',
    32: 'attack',
};

class Controls {
    constructor() {
        document.addEventListener('keydown', this.keydown.bind(this));
    }
    keydown(e) {
        if (document.activeElement === document.getElementById('m')) {
            //make sure user isn't chatting
        } else if (KEY_MAP[e.keyCode] == 'chat') {
            document.getElementById('m').focus();
            e.preventDefault();
        } else if (typeof KEY_MAP[e.keyCode] === 'undefined') {
            //console.log("unknown key pressed: " + e.keyCode)
        } else {
            socket.emit('player_action', KEY_MAP[e.keyCode])
        }
    }
}

var controls = undefined;
$(function () {
    controls = new Controls();
});