var KEY_MAP = {
    13: 'chat',
    191: 'command',
    27: 'escape',
    37: 'turn_left',
    38: 'turn_up',
    39: 'turn_right',
    40: 'turn_down',
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
            if (KEY_MAP[e.keyCode] == 'escape') {
                document.getElementById('m').blur();
            } else if (e.keyCode == 38) {
                if (historyPos > 0) {
                    if (historyPos == messageHistory.length) {
                        currentCache = $('#m').val();
                    }
                    historyPos--;
                    $('#m').val(messageHistory[historyPos]);
                }
            } else if (e.keyCode == 40) {
                if (historyPos < messageHistory.length) {
                    historyPos++;
                    if (historyPos == messageHistory.length) {
                        $('#m').val(currentCache);
                    } else {
                        $('#m').val(messageHistory[historyPos]);
                    }
                }
            }
        } else if (KEY_MAP[e.keyCode] == 'chat') {
            document.getElementById('m').focus();
            e.preventDefault();
        } else if (KEY_MAP[e.keyCode] == 'command') {
            document.getElementById('m').focus();
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