import { EQUIPMENT_SLOT } from './equipment_slot';

export class ArmorData {
    public static fromJSON(json: any) {
        return new ArmorData(json.coverage, json.resilience, json.armor, EQUIPMENT_SLOT[json.slot as keyof typeof EQUIPMENT_SLOT]);
    }
    constructor(public coverage: number, public resilience: number, public armor: number, public slot: EQUIPMENT_SLOT) { }
    public toJSON() {
        return {
            'coverage': this.coverage,
            'resilience': this.resilience,
            'armor': this.armor,
            'slot': EQUIPMENT_SLOT[this.slot],
        };
    }
    public clone(): ArmorData {
        return new ArmorData(this.coverage, this.resilience, this.armor, this.slot);
    }
}
