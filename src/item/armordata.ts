import * as t from 'io-ts';
import { EQUIPMENT_SLOT } from './equipment_slot';

export type ArmorDataSchema = t.TypeOf<typeof ArmorData.schema>;

export class ArmorData {
    public static schema = t.type({
        'coverage': t.number,
        'resilience': t.number,
        'armor': t.number,
        'slot': t.keyof(EQUIPMENT_SLOT),
    });
    public static fromJSON(json: ArmorDataSchema) {
        return new ArmorData(
            json.coverage,
            json.resilience,
            json.armor,
            EQUIPMENT_SLOT[json.slot as keyof typeof EQUIPMENT_SLOT]
        );
    }
    constructor(
        public coverage: number,
        public resilience: number,
        public armor: number,
        public slot: EQUIPMENT_SLOT
    ) { }
    public equals(other: ArmorData) {
        return this.coverage === other.coverage &&
            this.resilience === other.resilience &&
            this.armor === other.armor &&
            this.slot === other.slot;
    }
    public toJSON(): ArmorDataSchema {
        return {
            'coverage': this.coverage,
            'resilience': this.resilience,
            'armor': this.armor,
            'slot': EQUIPMENT_SLOT[this.slot] as keyof typeof EQUIPMENT_SLOT,
        };
    }
    public clone(): ArmorData {
        return new ArmorData(
            this.coverage,
            this.resilience,
            this.armor,
            this.slot,
        );
    }
}
