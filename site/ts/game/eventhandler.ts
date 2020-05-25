import { Graphics } from './graphics.js';
import type { Board, CharacterEquipment, CharacterStatus, Entity, Inventory, Item, Location, RELATIVE_DIRECTION } from './servertypes';
import { DIRECTION } from './servertypes.js';

type Events = {
    MESSAGE: {
        type: 'MESSAGE';
        message: string;
    }
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
    STATUS_CHANGE: {
        type: 'STATUS_CHANGE';
        entity_id: string;
        status: CharacterStatus;
    }
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
        entity_id: string;
        direction: keyof typeof DIRECTION;
        message: string;
    };
    ATTACK: {
        type: 'ATTACK';
        attacker_id: string;
        defender_id?: string | undefined;
        direction: keyof typeof DIRECTION;
        message: string;
    };
    PICKUP: {
        type: 'PICKUP';
        entity_id: string;
        item: Item;
        inventory: Inventory;
    };
    DROP: {
        type: 'DROP';
        message: string;
        entity_id: string;
        item: Item;
        inventory: Inventory;
    };
    EQUIP_ARMOR: {
        type: 'EQUIP_ARMOR',
        entity_id: string;
        item: Item;
        equipment: CharacterEquipment;
        inventory: Inventory,
    };
    UNEQUIP_ARMOR: {
        type: 'UNEQUIP_ARMOR',
        entity_id: string;
        item: Item;
        equipment: CharacterEquipment;
        inventory: Inventory,
    };
    EQUIP_WEAPON: {
        type: 'EQUIP_WEAPON',
        entity_id: string;
        item: Item;
        equipment: CharacterEquipment;
        inventory: Inventory,
    };
    UNEQUIP_WEAPON: {
        type: 'UNEQUIP_WEAPON',
        entity_id: string;
        item: Item;
        equipment: CharacterEquipment;
        inventory: Inventory,
    };
    USE_PORTAL: {
        type: 'USE_PORTAL';
        entity_id: string;
    }
    DEATH: {
        type: 'DEATH';
        entity_id: string;
        message: string;
    };
}

type Event = Events[keyof Events];

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class EventHandler {
    private queuedEvents: Event[] = [];
    constructor(
        private graphics: Graphics,
        private app: { player_entity_id: string, board: Board, entities: Entity[] },
        private chat: { messages: string[] }
    ) { }
    public pushEvent(event: Event) {
        this.queuedEvents.push(event);
    }
    public isProcessingEvents() {
        return this.queuedEvents.length > 0;
    }
    public startEventProcessingLoop() {
        setTimeout(async () => {
            await this.handleNextEvent();
            this.startEventProcessingLoop();
        }, 20);
    }
    private async handleNextEvent() {
        if (this.queuedEvents.length > 0) {
            const event = this.queuedEvents.shift();
            if (event === undefined) {
                return;
            }
            await this.processEvent(event);
        }
    }
    private async glideLoc(from: Location, to: Location, steps = 5, time = 100) {
        const dx = (to.x - from.x) / steps;
        const dy = (to.y - from.y) / steps;
        for (let i = 0; i < steps; i++) {
            from.x += dx;
            from.y += dy;
            await sleep(time / steps);
        }
        from.x = to.x;
        from.y = to.y
    }
    private async playAnimation(ent: Entity, animation: string) {
        let sprite = ent.components.sprite;
        if (typeof sprite === 'string') {
            sprite = sprite + '/' + animation;
            ent.animation_playing = sprite;
            ent.animation_start_time = Date.now();
            await sleep(this.graphics.getAnimation(sprite).duration);
            ent.animation_playing = undefined;
        }
    }
    private async processEvent(event: Event) {
        switch (event.type) {
            case 'MESSAGE': {
                this.chat.messages.push(event.message);
                break;
            }
            case 'SET_BOARD': {
                this.app.board = event.board;
                break;
            } case 'NEW_ROUND': {
                this.chat.messages.push(event.message);
                break;
            } case 'ADD_ENTITY': {
                this.app.entities.push(event.entity);
                break;
            } case 'REMOVE_ENTITY': {
                const index = this.app.entities.findIndex((ent) => ent.id === event.id);
                if (index < 0) {
                    console.log('Cannot remove nonexistent Entity!');
                } else {
                    this.app.entities.splice(index, 1);
                }
                break;
            } case 'STATUS_CHANGE': {
                const ent = this.app.entities.find((e) => e.id === event.entity_id);
                if (ent === undefined) {
                    console.log('Cannot set status of nonexistent Entity!');
                } else if (ent.components.sheet === undefined) {
                    console.log('Cannot set status entity that has no sheet!');
                } else {
                    ent.components.sheet.status = event.status;
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
                const ent = this.app.entities.find((e) => e.id === event.entity_id);
                if (ent === undefined) {
                    console.log('Cannot move nonexistent Entity!');
                } else {
                    this.chat.messages.push(`${ent.components.name} moves ${event.direction.toLowerCase()}`);
                    await this.glideLoc(ent.location, event.location);
                }
                break;
            } case 'STRAFE': {
                const ent = this.app.entities.find((e) => e.id === event.entity_id);
                if (ent === undefined) {
                    console.log('Cannot move nonexistent Entity!');
                } else {
                    this.chat.messages.push(`${ent.components.name} sidesteps ${event.rel_dir.toLowerCase()}`);
                    await this.glideLoc(ent.location, event.location);
                }
                break;
            } case 'BACKSTEP': {
                const ent = this.app.entities.find((e) => e.id === event.entity_id);
                if (ent === undefined) {
                    console.log('Cannot move nonexistent Entity!');
                } else {
                    this.chat.messages.push(`${ent.components.name} steps backward`);
                    await this.glideLoc(ent.location, event.location);
                }
                break;
            } case 'TURN': {
                const ent = this.app.entities.find((e) => e.id === event.entity_id);
                if (ent === undefined) {
                    console.log('Cannot turn nonexistent Entity!');
                } else {
                    this.chat.messages.push(event.message);
                    ent.components.direction = event.direction;
                }
                break;
            } case 'ATTACK': {
                const attacker = this.app.entities.find((e) => e.id === event.attacker_id);
                if (attacker === undefined) {
                    console.log('Cannot attack with nonexistent Entity!');
                } else {
                    this.chat.messages.push(event.message);
                    this.graphics.playAnimation('attack/swing', attacker.location, DIRECTION[event.direction]);
                    const defender = this.app.entities.find((e) => e.id === event.defender_id);
                    await this.playAnimation(attacker, 'attack');
                    if (defender !== undefined) {
                        await this.playAnimation(defender, 'damaged');
                    }
                }
                break;
            } case 'PICKUP': {
                const ent = this.app.entities.find((e) => e.id === event.entity_id);
                if (ent === undefined) {
                    console.log('Cannot pickup item with nonexistent Entity!');
                } else {
                    ent.components.inventory = event.inventory;
                    this.chat.messages.push(`${ent.components.name} picks up the ${event.item.name}`);
                }
                break;
            } case 'DROP': {
                const ent = this.app.entities.find((e) => e.id === event.entity_id);
                if (ent === undefined) {
                    console.log('Cannot drop item with nonexistent Entity!');
                } else {
                    ent.components.inventory = event.inventory;
                    this.chat.messages.push(`${ent.components.name} drops the ${event.item.name}`);
                }
                break;
            } case 'EQUIP_ARMOR': {
                const ent = this.app.entities.find((e) => e.id === event.entity_id);
                if (ent === undefined) {
                    console.log('Cannot equip armor with nonexistent Entity!');
                } else {
                    ent.components.inventory = event.inventory;
                    const sheet = ent.components.sheet;
                    if (sheet !== undefined) {
                        sheet.equipment = event.equipment;
                    }
                    this.chat.messages.push(`${ent.components.name} puts on their ${event.item.name}`);
                }
                break;
            } case 'UNEQUIP_ARMOR': {
                const ent = this.app.entities.find((e) => e.id === event.entity_id);
                if (ent === undefined) {
                    console.log('Cannot equip armor with nonexistent Entity!');
                } else {
                    ent.components.inventory = event.inventory;
                    const sheet = ent.components.sheet;
                    if (sheet !== undefined) {
                        sheet.equipment = event.equipment;
                    }
                    this.chat.messages.push(`${ent.components.name} takes off their ${event.item.name}`);
                }
                break;
            } case 'EQUIP_WEAPON': {
                const ent = this.app.entities.find((e) => e.id === event.entity_id);
                if (ent === undefined) {
                    console.log('Cannot equip armor with nonexistent Entity!');
                } else {
                    ent.components.inventory = event.inventory;
                    const sheet = ent.components.sheet;
                    if (sheet !== undefined) {
                        sheet.equipment = event.equipment;
                    }
                    this.chat.messages.push(`${ent.components.name} takes out their ${event.item.name}`);
                }
                break;
            } case 'UNEQUIP_WEAPON': {
                const ent = this.app.entities.find((e) => e.id === event.entity_id);
                if (ent === undefined) {
                    console.log('Cannot equip armor with nonexistent Entity!');
                } else {
                    ent.components.inventory = event.inventory;
                    const sheet = ent.components.sheet;
                    if (sheet !== undefined) {
                        sheet.equipment = event.equipment;
                    }
                    this.chat.messages.push(`${ent.components.name} puts away their ${event.item.name}`);
                }
                break;
            } case 'USE_PORTAL': {
                const ent = this.app.entities.find((e) => e.id === event.entity_id);
                if (ent === undefined) {
                    console.log('Cannot drop item with nonexistent Entity!');
                } else {
                    this.chat.messages.push(`${ent.components.name} traverses the stairs`);
                }
                break;
            } case 'DEATH': {
                const ent = this.app.entities.find((e) => e.id === event.entity_id);
                if (ent === undefined) {
                    console.log('Cannot kill nonexistent Entity!');
                } else {
                    this.chat.messages.push(event.message);
                    await this.playAnimation(ent, 'death');
                }
                break;
            } default: {
                console.log('Unknown event type: ' + (event as any).type + '!');
            }
        }
    }
}
