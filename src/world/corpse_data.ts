import * as t from 'io-ts';
import type { Entity } from '../world/entity';

export type CorpseDataSchema = t.TypeOf<typeof CorpseData.schema>;

export class CorpseData {
    public static schema = t.type({
        'placeholder': t.literal('placeholder'),
    });

    public static fromJSON(json: CorpseDataSchema): CorpseData {
        return new CorpseData();
    }
    constructor() { /* nothing for now */ }

    public toJSON(): CorpseDataSchema {
        return {
            'placeholder': 'placeholder',
        }
    }
    public getClientJSON(viewer: Entity) {
        return this.toJSON();
    }
}
