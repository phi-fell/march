import type { Board, DIRECTION, Entity, Location, RELATIVE_DIRECTION } from './servertypes';

type Events = {
    SET_BOARD: {
        type: 'SET_BOARD';
        board: Board;
    };
    NEW_ROUND: {
        type: 'NEW_ROUND';
        message: string;
    };
    ADD_ENTITY: {
        type: 'ADD_ENTITY';
        entity: Entity;
    };
    REMOVE_ENTITY: {
        type: 'REMOVE_ENTITY';
        id: string;
    };
    WAIT: {
        type: 'WAIT';
        message: string;
    };
    WAIT_ONCE: {
        type: 'WAIT_ONCE';
        message: string;
    };
    WAIT_ROUND: {
        type: 'WAIT_ROUND';
        message: string;
    };
    SAY: {
        type: 'SAY';
        message: string;
    };
    LOOK: {
        type: 'LOOK';
        message: string;
    };
    MOVE: {
        type: 'MOVE';
        entity_id: string;
        location: Location;
        direction: keyof typeof DIRECTION;
    };
    STRAFE: {
        type: 'STRAFE';
        entity_id: string;
        location: Location;
        rel_dir: keyof typeof RELATIVE_DIRECTION;
    };
    BACKSTEP: {
        type: 'BACKSTEP';
        entity_id: string;
        location: Location;
    };
    TURN: {
        type: 'TURN';
        message: string;
    };
    ATTACK: {
        type: 'ATTACK';
        message: string;
    };
    PICKUP: {
        type: 'PICKUP';
        message: string;
    };
    DROP: {
        type: 'DROP';
        message: string;
    };
    DEATH: {
        type: 'DEATH';
        message: string;
    };
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
            case 'SET_BOARD': {
                this.app.board = event.board;
                break;
            } case 'NEW_ROUND': {
                this.chat.messages.push(event.message);
                break;
            } case 'ADD_ENTITY': {
                this.app.board.entities.push(event.entity);
                break;
            } case 'REMOVE_ENTITY': {
                const index = this.app.board.entities.findIndex((ent) => ent.id === event.id);
                if (index < 0) {
                    console.log('Cannot remove nonexistent Entity!');
                } else {
                    this.app.board.entities.splice(index, 1);
                }
                break;
            } case 'WAIT': {
                this.chat.messages.push(event.message);
                break;
            } case 'WAIT_ONCE': {
                this.chat.messages.push(event.message);
                break;
            } case 'WAIT_ROUND': {
                this.chat.messages.push(event.message);
                break;
            } case 'SAY': {
                this.chat.messages.push(event.message);
                break;
            } case 'LOOK': {
                this.chat.messages.push(event.message);
                break;
            } case 'MOVE': {
                const ent = this.app.board.entities.find((e) => e.id === event.entity_id);
                if (ent === undefined) {
                    console.log('Cannot move nonexistent Entity!');
                } else {
                    ent.location = event.location
                    this.chat.messages.push(`${ent.components.name} moves ${event.direction.toLowerCase()}`);
                }
                break;
            } case 'STRAFE': {
                const ent = this.app.board.entities.find((e) => e.id === event.entity_id);
                if (ent === undefined) {
                    console.log('Cannot move nonexistent Entity!');
                } else {
                    ent.location = event.location
                    this.chat.messages.push(`${ent.components.name} sidesteps ${event.rel_dir.toLowerCase()}`);
                }
                break;
            } case 'BACKSTEP': {
                const ent = this.app.board.entities.find((e) => e.id === event.entity_id);
                if (ent === undefined) {
                    console.log('Cannot move nonexistent Entity!');
                } else {
                    ent.location = event.location
                    this.chat.messages.push(`${ent.components.name} steps backward`);
                }
                break;
            } case 'TURN': {
                this.chat.messages.push(event.message);
                break;
            } case 'ATTACK': {
                this.chat.messages.push(event.message);
                break;
            } case 'PICKUP': {
                this.chat.messages.push(event.message);
                break;
            } case 'DROP': {
                this.chat.messages.push(event.message);
                break;
            } case 'DEATH': {
                this.chat.messages.push(event.message);
                break;
            } default: {
                console.log('Unknown event type: ' + (event as any).type + '!');
            }
        }
    }
}
