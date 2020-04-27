import * as t from 'io-ts';
import { Random } from './random';

type RetreiveChanceType<T> = T extends { type: infer U } ? U : never;
export type CHANCE_TYPE = RetreiveChanceType<ChanceSchema>;

export type ChanceSchema = t.TypeOf<typeof Chance.schema>;

export class Chance {
    public static schema = t.union([
        t.number,
        t.type({
            'type': t.literal('range'),
            'min': t.number,
            'max': t.number
        }),
        t.type({
            'type': t.literal('one_of'),
            'values': t.array(t.number),
        }),
        t.type({
            'type': t.literal('independent'),
            'probability': t.number,
            'count': t.number,
        }),
    ]);
    public static fromJSON(json: ChanceSchema): Chance {
        return new Chance(json);
    }
    constructor(private self: ChanceSchema) { }
    public toJSON(): ChanceSchema {
        return this.self;
    }
    public getValue(random: Random = new Random()): number {
        if (typeof this.self === 'number') {
            return this.self;
        }
        switch (this.self.type) {
            case 'range':
                return random.int(this.self.min, this.self.max + 1);
            case 'one_of':
                return this.self.values[random.int(0, this.self.values.length)];
            case 'independent':
                let ret = 0;
                for (let i = 0; i < this.self.count; i++) {
                    if (random.float() <= this.self.probability) {
                        ret++;
                    }
                }
                return ret;
        }
    }
}
