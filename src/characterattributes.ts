export enum ATTRIBUTE {
    STRENGTH,
    ENDURANCE,
    CONSTITUTION,
    AGILITY,
    DEXTERITY,
    SPEED,
    CHARISMA,
    LOGIC,
    WISDOM,
    MEMORY,
    WILLPOWER,
    LUCK,
}

const ATTRIBUTE_COUNT = 12;

export class CharacterAttributes {
    private values: number[];
    constructor() {
        this.values = [];
        for (var i = 0; i < ATTRIBUTE_COUNT; i++) {
            this.values[i] = 0
        }
    }
    get(attr: ATTRIBUTE): number {
        return this.values[attr];
    }
    set(attr: ATTRIBUTE, val: number) {
        this.values[attr] = val;
    }
    getSumWith(other: CharacterAttributes): CharacterAttributes {
        var ret: CharacterAttributes = new CharacterAttributes();
        for (var i = 0; i < ATTRIBUTE_COUNT; i++) {
            ret.values[i] = this.values[i] + other.values[i];
        }
        return ret;
    }
    clone() {
        var ret: CharacterAttributes = new CharacterAttributes();
        for (var i = 0; i < ATTRIBUTE_COUNT; i++) {
            ret.values[i] = this.values[i];
        }
        return ret;
    }
    toJSON() {
        var ret = {}
        for (var i = 0; i < ATTRIBUTE_COUNT; i++) {
            ret[ATTRIBUTE[i]] = this.values[i];
        }
        return ret;
    }
    static fromJSON(json) {
        var ret = new CharacterAttributes();
        for (var i = 0; i < ATTRIBUTE_COUNT; i++) {
            ret.values[i] = json[ATTRIBUTE[i]];
        }
        return ret;
    }
}