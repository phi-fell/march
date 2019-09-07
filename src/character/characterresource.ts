export const enum RESOURCE {
    MANA,
}

export class CharacterResource {
    public capacity: number;
    public conductance: number;
    public generation: number;
    constructor() {
        this.capacity = 0;
        this.conductance = 0;
        this.generation = 0;
    }
}
