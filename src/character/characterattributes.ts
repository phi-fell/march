import * as t from 'io-ts';

export enum ATTRIBUTE {
    // body
    STRENGTH, // physical strength, ability to exert force via muscles.  affects e.g. lifting weight, max force of a punch, jump height
    ENDURANCE, // ability to endure utilization of the body.  "exercise resistance", affects running for extended periods, wearing heavy armor for extended periods, how fast one gets tired
    VITALITY, // ability to endure injury, disease, etc.  "health" "constitution",  affects ability to survive veing stabbed, bashed, getting sick, poisoned, etc.
    // movement
    AGILITY, // dexterity of the feet, ability to dodge attacks, balancing acts, obstacle courses
    DEXTERITY, // hand eye coordination, using hands "dextrously", making a watch, firing a bow (draw weight is STR tho), lockpicking, getting a dagger into a gap in armor
    SPEED, // how fast one moves.  running, swinging a weapon, anything speed related
    // mental
    LOGIC, // intellect, reason, puzzle/problem solving skills,
    INTUITION, // wisdom, common sense, accuracy of "gut feelings", general knowledge, experience with situations/places/people/items/etc, as well as ability to intuit or have epiphanies.
    PERCEPTION, // ability to notice things, discrepancies, etc. - how discerning one's senses are
    // social/other
    CHARISMA, // the social stat: raw presence, whether physical attractiveness, mannerisms or something else. more charisma = people are more pliable and likely to agree with you or be convinced
    WILL, // willpower: resistance to the wills, whims, manipulations and designs of others. capacity to exert oneself upon the world.  at high will, the world moves at your whim.  reality is subsumed into your existence.
    LUCK, // the extent to which you have the world's favor
}

const ATTRIBUTE_COUNT: number = ATTRIBUTE.LUCK + 1;

export type CharacterAttributesSchema = t.TypeOf<typeof CharacterAttributes.schema>;

export class CharacterAttributes {
    public static schema = t.type(Object.keys(ATTRIBUTE).reduce((all, attr) => {
        if (isNaN(Number(attr))) {
            all[attr as keyof typeof ATTRIBUTE] = t.number;
        }
        return all;
    }, {} as Record<keyof typeof ATTRIBUTE, t.NumberC>));

    public static fromJSON(json: CharacterAttributesSchema) {
        const ret = new CharacterAttributes();
        for (let i = 0; i < ATTRIBUTE_COUNT; i++) {
            ret.values[i] = json[ATTRIBUTE[i] as keyof typeof ATTRIBUTE] || 0;
        }
        return ret;
    }
    public static fromPartialJSON(json: Partial<CharacterAttributesSchema>) {
        const ret = new CharacterAttributes();
        for (let i = 0; i < ATTRIBUTE_COUNT; i++) {
            ret.values[i] = json[ATTRIBUTE[i] as keyof typeof ATTRIBUTE] || 0;
        }
        return ret;
    }

    private values: number[];
    constructor() {
        this.values = [];
        for (let i = 0; i < ATTRIBUTE_COUNT; i++) {
            this.values[i] = 0;
        }
    }
    public get(attr: ATTRIBUTE): number {
        return this.values[attr];
    }
    public set(attr: ATTRIBUTE, val: number) {
        this.values[attr] = val;
    }
    public getEssenceCost(): number {
        let ret: number = 0;
        for (let i = 0; i < ATTRIBUTE_COUNT; i++) {
            ret += ((this.values[i] + 1) * (this.values[i])) / 2;
        }
        return ret;
    }
    public getLevelupCosts() {
        const ret: CharacterAttributes = new CharacterAttributes();
        for (let i = 0; i < ATTRIBUTE_COUNT; i++) {
            ret.values[i] = this.values[i] + 1;
        }
        return ret;
    }
    public getSumWith(other: CharacterAttributes): CharacterAttributes {
        const ret: CharacterAttributes = new CharacterAttributes();
        for (let i = 0; i < ATTRIBUTE_COUNT; i++) {
            ret.values[i] = this.values[i] + other.values[i];
        }
        return ret;
    }
    public getScaledBy(scale: number): CharacterAttributes {
        const ret: CharacterAttributes = new CharacterAttributes();
        for (let i = 0; i < ATTRIBUTE_COUNT; i++) {
            ret.values[i] = this.values[i] * scale;
        }
        return ret;
    }
    public getFloored(): CharacterAttributes {
        const ret: CharacterAttributes = new CharacterAttributes();
        for (let i = 0; i < ATTRIBUTE_COUNT; i++) {
            ret.values[i] = Math.floor(this.values[i]);
        }
        return ret;
    }
    public clone() {
        const ret: CharacterAttributes = new CharacterAttributes();
        for (let i = 0; i < ATTRIBUTE_COUNT; i++) {
            ret.values[i] = this.values[i];
        }
        return ret;
    }
    public toJSON(): CharacterAttributesSchema {
        return this.values.reduce(
            (attributes: CharacterAttributesSchema, value: number, attribute: ATTRIBUTE) => {
                attributes[ATTRIBUTE[attribute] as keyof typeof ATTRIBUTE] = value;
                return attributes;
            }, {} as CharacterAttributesSchema,
        );
    }
}
