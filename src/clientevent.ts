export enum EVENT_TYPE {
    NEW_ROUND,
    MOVE,
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

export class MoveEvent implements ClientEvent {
    public type: EVENT_TYPE.MOVE = EVENT_TYPE.MOVE;
    public toJSON(): object {
        return { 'type': EVENT_TYPE[this.type] };
    }
}

export class AttackEvent implements ClientEvent {
    public type: EVENT_TYPE.ATTACK = EVENT_TYPE.ATTACK;
    public toJSON(): object {
        return { 'type': EVENT_TYPE[this.type] };
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
