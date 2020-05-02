import * as t from 'io-ts';

export type WeaponDataSchema = t.TypeOf<typeof WeaponData.schema>;

export class WeaponData {
    public static schema = t.type({
        'one_handed': t.boolean,
        'piercing': t.number,
        'sharpness': t.number,
        'force': t.number,
        'precision': t.number,
        'speed': t.number,
        'attack_animation': t.string,
    });
    public static fromJSON(json: WeaponDataSchema) {
        return new WeaponData(
            json.one_handed,
            json.piercing,
            json.sharpness,
            json.force,
            json.precision,
            json.speed,
            json.attack_animation,
        );
    }
    constructor(
        public one_handed: boolean,
        public piercing: number,
        public sharpness: number,
        public force: number,
        public precision: number,
        public speed: number,
        public attack_animation: string,
    ) { }
    public equals(other: WeaponData) {
        return this.one_handed === other.one_handed &&
            this.piercing === other.piercing &&
            this.sharpness === other.sharpness &&
            this.force === other.force &&
            this.precision === other.precision &&
            this.speed === other.speed &&
            this.attack_animation === other.attack_animation;
    }
    public toJSON(): WeaponDataSchema {
        return {
            'one_handed': this.one_handed,
            'piercing': this.piercing,
            'sharpness': this.sharpness,
            'force': this.force,
            'precision': this.precision,
            'speed': this.speed,
            'attack_animation': this.attack_animation,
        };
    }
    public clone() {
        return new WeaponData(
            this.one_handed,
            this.piercing,
            this.sharpness,
            this.force,
            this.precision,
            this.speed,
            this.attack_animation,
        );
    }
}
