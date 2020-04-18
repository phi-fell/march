import * as t from 'io-ts';
import type { UUID } from '../../math/random';
import { CELL_GENERATION } from './cellgeneration';

export type CellAttributesSchema = t.TypeOf<typeof CellAttributes.schema>;

export class CellAttributes {
    public static schema = t.type({
        'seed': t.string,
        'type': t.keyof(CELL_GENERATION),
        'width': t.number,
        'height': t.number,
    });

    public static fromJSON(json: CellAttributesSchema): CellAttributes {
        return new CellAttributes(
            json.seed,
            CELL_GENERATION[json.type],
            json.width,
            json.height
        );
    }

    constructor(
        public readonly seed: UUID,
        public readonly type: CELL_GENERATION,
        public readonly width: number,
        public readonly height: number,
    ) { }
    public toJSON(): CellAttributesSchema {
        return {
            'seed': this.seed,
            'type': CELL_GENERATION[this.type] as keyof typeof CELL_GENERATION,
            'width': this.width,
            'height': this.height,
        }
    }
}
