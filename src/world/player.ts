import * as t from 'io-ts';

import { CharacterSheet } from '../character/charactersheet';
import { Random } from '../math/random';

export type PlayerSchema = t.TypeOf<typeof Player.schema>;

export class Player {
    public static schema = t.type({
        'id': t.string,
        'sheet': CharacterSheet.schema,
    });

    public static async fromJSON(json: PlayerSchema): Promise<Player> {
        const ret = new Player(json.id);
        ret.sheet = CharacterSheet.fromJSON(json.sheet);
        return ret;
    }

    public sheet: CharacterSheet = new CharacterSheet();
    public constructor(protected _id: string = Random.uuid()) { }
    public get id() {
        return this._id;
    }
    public toJSON(): PlayerSchema {
        return {
            'id': this.id,
            'sheet': this.sheet.toJSON(),
        };
    }
}
