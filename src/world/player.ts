import * as t from 'io-ts';

import { CharacterSheet } from '../character/charactersheet';
import { Random } from '../math/random';

const entity_ref_schema = t.type({
    'instance_id': t.string,
    'entity_id': t.string,
});

type EntityRef = t.TypeOf<typeof entity_ref_schema>;

export type PlayerSchema = t.TypeOf<typeof Player.schema>;

export class Player {
    public static schema = t.type({
        'id': t.string,
        'sheet': CharacterSheet.schema,
        'home_instance_id': t.union([t.string, t.undefined]),
        'entity_ref': t.union([entity_ref_schema, t.undefined]),
    });

    public static async fromJSON(json: PlayerSchema): Promise<Player> {
        const ret = new Player(json.id);
        ret.sheet = CharacterSheet.fromJSON(json.sheet);
        ret.home_instance_id = json.home_instance_id;
        ret.entity_ref = json.entity_ref;
        return ret;
    }

    public sheet: CharacterSheet = new CharacterSheet();
    private home_instance_id?: string;
    private entity_ref?: EntityRef;
    constructor(protected _id: string = Random.uuid()) { }
    public get id() {
        return this._id;
    }
    public toJSON(): PlayerSchema {
        return {
            'id': this.id,
            'sheet': this.sheet.toJSON(),
            'home_instance_id': this.home_instance_id,
            'entity_ref': this.entity_ref,
        };
    }
}
