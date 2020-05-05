import type { EventHandler } from './eventhandler';

const MACRO_SHORTCUTS: Record<string, string[]> = {
    '37': ['turn left'],
    '38': ['turn up'],
    '39': ['turn right'],
    '40': ['turn down'],
    '73': ['strafe up'],
    '74': ['strafe left'],
    '75': ['strafe down'],
    '76': ['strafe right'],
    '87': ['turn up', 'move up'],
    '65': ['turn left', 'move left'],
    '83': ['turn down', 'move down'],
    '68': ['turn right', 'move right'],
    '32': ['attack'],
    '88': ['unwait'],
    '90': ['wait'],
    '190': ['use_portal'],
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
    constructor(
        private socket: SocketIOClient.Socket,
        private event_handler: EventHandler,
        private chat: { messages: string[], current_message: string, typing: boolean }
    ) {
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
                        e.preventDefault();
                        return;
                    case CHAT_SHORTCUT.NEXT:
                        historyPos++;
                        if (historyPos > message_history.length) {
                            historyPos = message_history.length;
                        } else if (historyPos === message_history.length) {
                            this.chat.current_message = message_cache;
                            message_cache = '';
                        } else {
                            this.chat.current_message = message_history[historyPos];
                        }
                        e.preventDefault();
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
        } else if (MACRO_SHORTCUTS[e.keyCode] !== undefined) {
            const msgs = MACRO_SHORTCUTS[e.keyCode];
            if (this.event_handler.isProcessingEvents()) {
                if (msgs.includes('#unwait')) {
                    this.socket.emit('chat_message', '#unwait');
                }
            } else if (msgs.length > 1) {
                this.socket.emit('chat_message', `#[${msgs.join(',')}]`);
            } else {
                this.socket.emit('chat_message', `#${msgs[0]}`);
            }
        }
    }
}
