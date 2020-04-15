import * as t from 'io-ts';

import { CharacterSheet } from '../character/charactersheet';
import { Random } from '../math/random';
import type { Entity } from './entity';
import type { World } from './world';

const entity_ref_schema = t.type({
    'instance_id': t.string,
    'cell_id': t.string,
    'entity_id': t.string,
});

type EntityRef = t.TypeOf<typeof entity_ref_schema>;

export type PlayerSchema = t.TypeOf<typeof Player.schema>;

export class Player {
    public static schema = t.type({
        'id': t.string,
        'sheet': CharacterSheet.schema,
        'entity_ref': t.union([entity_ref_schema, t.undefined]),
    });

    public static async fromJSON(world: World, json: PlayerSchema): Promise<Player> {
        const ret = new Player(world, json.id);
        ret.sheet = CharacterSheet.fromJSON(json.sheet);
        ret.entity_ref = json.entity_ref;
        return ret;
    }

    public sheet: CharacterSheet = new CharacterSheet();
    private entity_ref?: EntityRef;
    private entity?: Entity;
    private _active: boolean = false;
    constructor(private world: World, protected _id: string = Random.uuid()) { }
    public get id() {
        return this._id;
    }
    public getEntity(): Entity {
        if (!this._active) {
            throw new Error('Player not active!');
        }
        if (this.entity === undefined) {
            throw new Error('Active player did not have a loaded EntityRef!')
        }
        return this.entity;
    }
    public async setActive() {
        if (this._active) {
            throw new Error('Player already active!');
        }
        if (this.entity_ref === undefined) {
            // TODO: create and set entity
        } else {
            const inst = await this.world.getInstance(this.entity_ref.instance_id);
            const cell = await inst.getCell(this.entity_ref.cell_id);
            this.entity = cell.getEntity(this.entity_ref.entity_id);
        }
        this._active = true;
    }
    public setInactive() {
        if (!this._active) {
            throw new Error('Player not active!');
        }
        if (this.entity === undefined) {
            throw new Error('Active player did not have a loaded EntityRef!')
        }
        this.entity_ref = {
            'instance_id': this.entity.location.instance_id,
            'cell_id': this.entity.location.cell_id,
            'entity_id': this.entity.id,
        }
        this.entity = undefined;
        this._active = false;
    }
    public toJSON(): PlayerSchema {
        return {
            'id': this.id,
            'sheet': this.sheet.toJSON(),
            'entity_ref': this.entity_ref,
        };
    }
}
