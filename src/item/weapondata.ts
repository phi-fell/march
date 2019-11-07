export class WeaponData {
    public static fromJSON(json: any) {
        return new WeaponData(
            json.one_handed,
            json.piercing,
            json.sharpness,
            json.force,
            json.precision,
            json.speed,
        );
    }
    constructor(
        public one_handed: boolean,
        public piercing: number,
        public sharpness: number,
        public force: number,
        public precision: number,
        public speed: number,
    ) { }
    public toJSON() {
        return {
            'one_handed': this.one_handed,
            'piercing': this.piercing,
            'sharpness': this.sharpness,
            'force': this.force,
            'precision': this.precision,
            'speed': this.speed,
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
        );
    }
}
