import type { Damage } from './damage';
import { DIRECTION } from './direction';
import type { Entity } from './entity';

export enum EVENT_TYPE {
    NEW_ROUND,
    ADD_MOB,
    REMOVE_MOB,
    MOVE,
    TURN,
    ATTACK,
    WAIT,
    BLEED,
    HEAL,
    PICKUP,
    DROP,
    DEATH,
}

export interface ClientEvent {
    type: EVENT_TYPE;
    toJSON(): object;
}

export class NewRoundEvent implements ClientEvent {
    public type: EVENT_TYPE.NEW_ROUND = EVENT_TYPE.NEW_ROUND;
    public toJSON(): object {
        return { 'type': EVENT_TYPE[this.type] };
    }
}

export class AddMobEvent implements ClientEvent {
    public type: EVENT_TYPE.ADD_MOB = EVENT_TYPE.ADD_MOB;
    constructor(public entity: Entity) { }
    public toJSON(): object {
        return {
            'type': EVENT_TYPE[this.type],
            'mob': {
                'name': this.entity.name,
                'id': this.entity.id,
                'location': this.entity.location,
                'direction': this.entity.direction,
                'type': this.entity.schema_id,
                'sheet': this.entity.charSheet.toJSON(), // TODO: limit what player can see
            },
        };
    }
}

export class RemoveMobEvent implements ClientEvent {
    public type: EVENT_TYPE.REMOVE_MOB = EVENT_TYPE.REMOVE_MOB;
    constructor(public entity: Entity) { }
    public toJSON(): object {
        return {
            'type': EVENT_TYPE[this.type],
            'mob': this.entity.id,
        };
    }
}

export class MoveEvent implements ClientEvent {
    public type: EVENT_TYPE.MOVE = EVENT_TYPE.MOVE;
    constructor(public entity: Entity, public direction: DIRECTION) { }
    public toJSON(): object {
        return {
            'type': EVENT_TYPE[this.type],
            'entity': this.entity.id,
            'direction': DIRECTION[this.direction],
        };
    }
}

export class TurnEvent implements ClientEvent {
    public type: EVENT_TYPE.TURN = EVENT_TYPE.TURN;
    constructor(public entity: Entity, public direction: DIRECTION) { }
    public toJSON(): object {
        return {
            'type': EVENT_TYPE[this.type],
            'entity': this.entity.id,
            'direction': DIRECTION[this.direction],
        };
    }
}

export class AttackEvent implements ClientEvent {
    public type: EVENT_TYPE.ATTACK = EVENT_TYPE.ATTACK;
    constructor(public success: boolean, public attacker: Entity, public defender: Entity | null, public damage: Damage[] = []) { }
    public toJSON(): object {
        return {
            'type': EVENT_TYPE[this.type],
            'success': this.success,
            'attacker': this.attacker.id,
            'defender': this.defender && this.defender.id,
            'damage': this.damage.map((d) => d.toJSON()),
        };
    }
}

export class WaitEvent implements ClientEvent {
    public type: EVENT_TYPE.WAIT = EVENT_TYPE.WAIT;
    public toJSON(): object {
        return { 'type': EVENT_TYPE[this.type] };
    }
}

export class BleedEvent implements ClientEvent {
    public type: EVENT_TYPE.BLEED = EVENT_TYPE.BLEED;
    public toJSON(): object {
        return { 'type': EVENT_TYPE[this.type] };
    }
}

export class HealEvent implements ClientEvent {
    public type: EVENT_TYPE.HEAL = EVENT_TYPE.HEAL;
    public toJSON(): object {
        return { 'type': EVENT_TYPE[this.type] };
    }
}

export class PickupEvent implements ClientEvent {
    public type: EVENT_TYPE.PICKUP = EVENT_TYPE.PICKUP;
    public toJSON(): object {
        return { 'type': EVENT_TYPE[this.type] };
    }
}

export class DropEvent implements ClientEvent {
    public type: EVENT_TYPE.DROP = EVENT_TYPE.DROP;
    public toJSON(): object {
        return { 'type': EVENT_TYPE[this.type] };
    }
}

export class DeathEvent implements ClientEvent {
    public type: EVENT_TYPE.DEATH = EVENT_TYPE.DEATH;
    public toJSON(): object {
        return { 'type': EVENT_TYPE[this.type] };
    }
}
