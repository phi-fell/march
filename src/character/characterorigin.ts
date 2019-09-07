export enum ORIGIN {
    NONE,
    BLOODED,
    AVRILEN,
    NEATHLING,
    MARROW,
}

export class CharacterOrigin {
    public static fromJSON(json) {
        return new CharacterOrigin(ORIGIN[json.type as string]);
    }
    constructor(private _type: ORIGIN) { }
    get type(): ORIGIN {
        return this._type;
    }
    public toJSON() {
        return {
            'type': ORIGIN[this._type],
        };
    }
}
