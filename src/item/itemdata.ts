import { EQUIPMENT_SLOT } from './equipment_slot';

export interface WeaponData extends ItemData {
    weapon_data: WeaponSubData;
}

export interface ArmorData extends ItemData {
    armor_data: ArmorSubData;
}

export class ItemData {
    public weapon_data?: WeaponSubData;
    public armor_data?: ArmorSubData;
    public isWeaponData(): this is WeaponData {
        return this.weapon_data !== undefined;
    }
    public isArmorData(): this is ArmorData {
        return this.armor_data !== undefined;
    }
}

export class WeaponSubData {
    public static fromJSON(json: any) {
        return new WeaponSubData(
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
    public toJSON() {
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
        return new WeaponSubData(
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

export class ArmorSubData {
    public static fromJSON(json: any) {
        return new ArmorSubData(
            json.coverage,
            json.resilience,
            json.armor,
            EQUIPMENT_SLOT[json.slot as keyof typeof EQUIPMENT_SLOT],
        );
    }
    constructor(
        public coverage: number,
        public resilience: number,
        public armor: number,
        public slot: EQUIPMENT_SLOT,
    ) { }
    public toJSON() {
        return {
            'coverage': this.coverage,
            'resilience': this.resilience,
            'armor': this.armor,
            'slot': EQUIPMENT_SLOT[this.slot],
        };
    }
    public clone(): ArmorSubData {
        return new ArmorSubData(
            this.coverage,
            this.resilience,
            this.armor,
            this.slot,
        );
    }
}
