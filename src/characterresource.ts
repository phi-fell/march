export const enum RESOURCE {
    MANA,
}

export class CharacterResource {
    capacity: number;
    conductance: number;
    generation: number;
    constructor() {
        this.capacity = 0;
        this.conductance = 0;
        this.generation = 0;
    }
}