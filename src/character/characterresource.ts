export enum RESOURCE {
    FLESH,
    BLOOD,
    BONE,
    SOUL,
    STAMINA,
    MANA,
}

export class CharacterResource {
    public capacity: number;
    public quantity: number;
    constructor(public readonly resource_type: RESOURCE) {
        this.capacity = 0;
        this.quantity = 0;
    }
    public refillToCapacity() {
        this.quantity = this.capacity;
    }
}
