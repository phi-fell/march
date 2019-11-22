export enum DAMAGE_TYPE {
    SHARP,
    BLUNT,
    BLEED,
    FIRE,
    ICE,
}

export class DamageMetaData {
    constructor(public min: number, public max: number, public gross: number, public armor: number, public resisted: number) { }
    public toJSON(): object {
        return {
            'min': this.min,
            'max': this.max,
            'gross': this.gross,
            'armor': this.armor,
            'resisted': this.resisted,
        };
    }
}

export class Damage {
    constructor(public type: DAMAGE_TYPE, public amount: number, public meta: DamageMetaData | null = null) { }
    public toJSON(): object {
        return {
            'type': DAMAGE_TYPE[this.type],
            'amount': this.amount,
            'meta': this.meta && this.meta.toJSON(),
        };
    }
}
