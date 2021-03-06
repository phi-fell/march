import * as t from 'io-ts';
import { ARMOR_SLOT } from './armor_slot';

export type ArmorDataSchema = t.TypeOf<typeof ArmorData.schema>;

export class ArmorData {
    public static schema = t.type({
        'coverage': t.number,
        'resilience': t.number,
        'armor': t.number,
        'slot': t.keyof(ARMOR_SLOT),
    });
    public static fromJSON(json: ArmorDataSchema) {
        return new ArmorData(
            json.coverage,
            json.resilience,
            json.armor,
            ARMOR_SLOT[json.slot as keyof typeof ARMOR_SLOT]
        );
    }
    constructor(
        public coverage: number,
        public resilience: number,
        public armor: number,
        public slot: ARMOR_SLOT
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
            'slot': ARMOR_SLOT[this.slot] as keyof typeof ARMOR_SLOT,
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
