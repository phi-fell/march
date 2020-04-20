import * as t from 'io-ts';
import { CharacterSheet } from '../character/charactersheet';
import { Random } from '../math/random';
import { Action, ActionClasses, ChatActions } from './action';
import { SayAction } from './action/say_action';
import type { Cell } from './cell';
import { Entity } from './entity';
import { CellAttributes } from './generation/cellattributes';
import { CELL_GENERATION } from './generation/cellgeneration';
import type { Instance } from './instance';
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
    public static async createPlayer(world: World, sheet: CharacterSheet) {
        const ret = new Player(world);
        ret.sheet = sheet;
        const inst: Instance = await world.createInstance();
        const cell: Cell = await inst.createCell(new CellAttributes(Random.getDeterministicID(), CELL_GENERATION.SLIME_CAVE, 50, 50));
        const loc = cell.getRandomPassableLocation();
        const ent = new Entity(world, loc);
        ret.entity_ref = {
            'instance_id': inst.id,
            'cell_id': cell.id,
            'entity_id': ent.id
        };
        return ret;
    }

    public sheet: CharacterSheet = new CharacterSheet();
    private entity_ref?: EntityRef;
    private entity?: Entity;
    private _active: boolean = false;
    private action_queue: Action[] = [];
    private constructor(private world: World, protected _id: string = Random.uuid()) { }
    public get id() {
        return this._id;
    }
    public sendText(text: string) {
        //TODO: e.g. socket.emit('chat', text);
    }
    public sayChatMessageAsEntity(msg: string) {
        const say = new SayAction(this.world, this.getEntity(), msg);
        say.perform();
    }
    public doAction(msg: string) {
        const args = msg.split(' ');
        const chat_action = args[0];
        args.shift();
        const action_type = ChatActions[action];
        if (action_type) {
            const ent = this.getEntity();
            const action = ActionClasses[action_type].fromArgs(this.world, ent, args);
            if (typeof action === 'string') {
                // TODO: push string to player
                return;
            }
            this.action_queue.push(action);
        } else {
            // TODO: push notice to player e.g. "Invalid action type!"
        }
    }
    public getQuery(query: string) {
        // TODO: handle query
    }
    public doCommand(command: string) {
        // TODO: handle command
    }
    public async getGameData() {
        const ent = this.getEntity();
        return {
            'player_sheet': this.sheet.getClientJSON(),
            'player_entity': ent.getClientJSON(),
            'board': (await this.world.getCell(ent.location.instance_id, ent.location.cell_id)).getClientJSON(ent),
        }
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
            throw new Error('Player did not have an attached entity!')
        }
        const cell = await this.world.getCell(this.entity_ref.instance_id, this.entity_ref.cell_id);
        this.entity = cell.getEntity(this.entity_ref.entity_id);
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
