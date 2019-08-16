export enum ORIGIN {
    NONE,
    BLOODED,
    AVRILEN,
    NEATHLING,
    MARROW
}

export class CharacterOrigin {
    constructor(private _type: ORIGIN) { }
    get type(): ORIGIN {
        return this._type;
    }
    toJSON() {
        return {
            'type': ORIGIN[this._type],
        };
    }
    static fromJSON(json) {
        return new CharacterOrigin(ORIGIN[json.type as string]);
    }
}