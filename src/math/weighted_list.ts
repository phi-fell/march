import * as t from 'io-ts';
import type { Constructed } from '../util/types';
import { Random } from './random';

/**
 * @param schema the type present in the list.  Must not be an array.  (Can be an object with properties that are arrays though)
 */
export function WeightedList<T extends t.Any>(schema: T) {
    const s = t.array(
        t.tuple([
            schema,
            t.number,
        ]),
    );
    const ret = class {
        public static schema = t.union([schema, s]);
        public static fromJSON(json: t.TypeOf<typeof ret.schema>): Constructed<typeof ret> {
            return new ret(json);
        }
        private total_weight: number;
        constructor(private self: t.TypeOf<typeof ret.schema>) {
            this.total_weight = 0;
            if (self instanceof Array) {
                for (const pair of self as t.TypeOf<typeof s>) {
                    this.total_weight += pair[1];
                }
            }
        }
        public toJSON(): t.TypeOf<typeof ret.schema> {
            return this.self;
        }
        public getValue(random: Random = new Random()): t.TypeOf<T> {
            if (this.self instanceof Array) {
                let w = random.int(0, this.total_weight);
                for (const pair of this.self as t.TypeOf<typeof s>) {
                    if (w < pair[1]) {
                        return pair[0];
                    }
                    w -= pair[1];
                }
            } else {
                return this.self;
            }
        }
    }
    return ret;
}
