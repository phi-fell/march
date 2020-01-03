var KEY_MAP = {
    13: ['chat'],
    191: ['command'],
    27: ['escape'],
    37: ['turn_left'],
    38: ['turn_up'],
    39: ['turn_right'],
    40: ['turn_down'],
    73: ['strafe_up'],
    74: ['strafe_left'],
    75: ['strafe_down'],
    76: ['strafe_right'],
    87: ['turn_up', 'move_up'],
    65: ['turn_left', 'move_left'],
    83: ['turn_down', 'move_down'],
    68: ['turn_right', 'move_right'],
    32: ['attack'],
    88: ['unwait'],
    90: ['wait'],
    190: ['portal'],
};
class Controls {
    constructor() {
        document.addEventListener('keydown', this.keydown.bind(this));
    }
    keydown(e) {
        if (document.activeElement === document.getElementById('m')) {
            //make sure user isn't chatting
            if (KEY_MAP[e.keyCode][0] == 'escape') {
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
        } else {
            if (typeof KEY_MAP[e.keyCode] === 'undefined') {
                //console.log("unknown key pressed: " + e.keyCode)
            } else {
                for (const action of KEY_MAP[e.keyCode]) {
                    if (action === 'chat') {
                        document.getElementById('m').focus();
                        e.preventDefault();
                    } else if (action === 'command') {
                        document.getElementById('m').focus();
                    } else {
                        socket.emit('player_action', { action });
                    }
                }
            }
        }
    }
}

var controls = undefined;
$(function () {
    controls = new Controls();
});
