import type { Board } from './servertypes';

type Events = {
    SET_BOARD: {
        type: 'SET_BOARD';
        board: Board;
    };
    NEW_ROUND: {
        type: 'NEW_ROUND';
        message: string;
    };
    WAIT: {
        type: 'WAIT';
        message: string;
    }
    WAIT_ONCE: {
        type: 'WAIT_ONCE';
        message: string;
    }
    WAIT_ROUND: {
        type: 'WAIT_ROUND';
        message: string;
    }
    SAY: {
        type: 'SAY';
        message: string;
    }
    LOOK: {
        type: 'LOOK';
        message: string;
    }
    MOVE: {
        type: 'MOVE';
        message: string;
    }
    STRAFE: {
        type: 'STRAFE';
        message: string;
    }
    BACKSTEP: {
        type: 'BACKSTEP';
        message: string;
    }
    TURN: {
        type: 'TURN';
        message: string;
    }
    ATTACK: {
        type: 'ATTACK';
        message: string;
    }
    PICKUP: {
        type: 'PICKUP';
        message: string;
    }
    DROP: {
        type: 'DROP';
        message: string;
    }
}

type Event = Events[keyof Events];

export class EventHandler {
    private queuedEvents: Event[] = [];
    constructor(private app: { board: Board }, private chat: { messages: string[] }) { }
    public pushEvent(event: Event) {
        this.queuedEvents.push(event);
        if (this.queuedEvents.length === 1) {
            this.startProcessingEvents();
        }
    }
    public isProcessingEvents() {
        return this.queuedEvents.length > 0;
    }
    private async startProcessingEvents() {
        while (this.queuedEvents.length > 0) {
            const event = this.queuedEvents.shift();
            if (event === undefined) {
                return;
            }
            await this.processEvent(event);
        }
    }
    private async processEvent(event: Event) {
        switch (event.type) {
            case 'SET_BOARD':
                this.app.board = event.board;
                break;
            case 'NEW_ROUND':
                this.chat.messages.push(event.message);
                break;
            case 'WAIT':
                this.chat.messages.push(event.message);
                break;
            case 'WAIT_ONCE':
                this.chat.messages.push(event.message);
                break;
            case 'WAIT_ROUND':
                this.chat.messages.push(event.message);
                break;
            case 'SAY':
                this.chat.messages.push(event.message);
                break;
            case 'LOOK':
                this.chat.messages.push(event.message);
                break;
            case 'MOVE':
                this.chat.messages.push(event.message);
                break;
            case 'STRAFE':
                this.chat.messages.push(event.message);
                break;
            case 'BACKSTEP':
                this.chat.messages.push(event.message);
                break;
            case 'TURN':
                this.chat.messages.push(event.message);
                break;
            case 'ATTACK':
                this.chat.messages.push(event.message);
                break;
            case 'PICKUP':
                this.chat.messages.push(event.message);
                break;
            case 'DROP':
                this.chat.messages.push(event.message);
                break;
            default:
                console.log('Unknown event type: ' + (event as any).type + '!');
        }
    }
}
