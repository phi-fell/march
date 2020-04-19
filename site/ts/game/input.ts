
const ACTION_SHORTCUTS: Record<string, string[]> = {
    '37': ['turn_left'],
    '38': ['turn_up'],
    '39': ['turn_right'],
    '40': ['turn_down'],
    '73': ['strafe_up'],
    '74': ['strafe_left'],
    '75': ['strafe_down'],
    '76': ['strafe_right'],
    '87': ['turn_up', 'move_up'],
    '65': ['turn_left', 'move_left'],
    '83': ['turn_down', 'move_down'],
    '68': ['turn_right', 'move_right'],
    '32': ['attack'],
    '88': ['unwait'],
    '90': ['wait'],
    '190': ['portal'],
};

enum GAME_SHORTCUT {
    CHAT,
    COMMAND,
}

enum CHAT_SHORTCUT {
    SEND,
    PREV,
    NEXT,
    ESCAPE,
}

const GAME_KEYBOARD_SHORTCUTS: Record<string, GAME_SHORTCUT> = {
    '13': GAME_SHORTCUT.CHAT,
    '191': GAME_SHORTCUT.COMMAND,
};

const CHAT_KEYBOARD_SHORTCUTS: Record<string, CHAT_SHORTCUT> = {
    '13': CHAT_SHORTCUT.SEND,
    '38': CHAT_SHORTCUT.PREV,
    '40': CHAT_SHORTCUT.NEXT,
    '27': CHAT_SHORTCUT.ESCAPE,
};

const message_history: string[] = [];
let message_cache: string = '';
let historyPos: number = 0;

export class Input {
    constructor(private socket: SocketIOClient.Socket, private chat: { messages: string[], current_message: string, typing: boolean }) {
        document.addEventListener('keydown', this.keydown.bind(this));
    }
    keydown(e: KeyboardEvent) {
        if (this.chat.typing) {
            if (CHAT_KEYBOARD_SHORTCUTS[e.keyCode] !== undefined) {
                switch (CHAT_KEYBOARD_SHORTCUTS[e.keyCode]) {
                    case CHAT_SHORTCUT.SEND:
                        const msg = this.chat.current_message;
                        if (msg.length > 0) {
                            this.chat.messages.push(msg);
                            message_history.push(msg);
                            this.socket.emit('chat_message', msg);
                        }
                        this.chat.current_message = '';
                        message_cache = '';
                        historyPos = message_history.length;
                        $('#chat_input').blur();
                        return;
                    case CHAT_SHORTCUT.PREV:
                        if (historyPos === message_history.length) {
                            message_cache = this.chat.current_message;
                        }
                        historyPos--;
                        if (historyPos < 0) {
                            historyPos = 0;
                        }
                        this.chat.current_message = message_history[historyPos];
                        return;
                    case CHAT_SHORTCUT.NEXT:
                        historyPos++;
                        if (historyPos > message_history.length) {
                            historyPos = message_history.length;
                        } else if (historyPos === message_history.length) {
                            this.chat.current_message = message_cache;
                            message_cache = '';
                        }
                        return;
                    case CHAT_SHORTCUT.ESCAPE:
                        $('#chat_input').blur();
                        return;
                }
            }
        } else if (GAME_KEYBOARD_SHORTCUTS[e.keyCode] !== undefined) {
            switch (GAME_KEYBOARD_SHORTCUTS[e.keyCode]) {
                case GAME_SHORTCUT.CHAT:
                    $('#chat_input').focus();
                    e.preventDefault();
                    return;
                case GAME_SHORTCUT.COMMAND:
                    $('#chat_input').focus();
                    return;
            }
        } else {
            // ACTIONS
            // TODO: do not send action if there are events/animations currently playing (unless action is unwait)
        }
    }
}
