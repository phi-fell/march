import * as t from 'io-ts';

import { File, OwnedFile } from '../system/file';
import { FileBackedData } from '../system/file_backed_data';
import { Instance } from './instance';
import type { UUID } from '../math/random';

const WORLD_DIR = 'world';

const instance_ref_schema = t.string;

export type WorldSchema = t.TypeOf<typeof World.schema>;

export class World extends FileBackedData {
    public static schema = t.type({
        'instances': t.array(instance_ref_schema),
    });

    public static async loadWorldFromFile(file: OwnedFile): Promise<World> {
        const world = new World(file);
        await world.ready();
        return world;
    }

    private _instances: Record<string, Instance> = {};
    private _instance_refs: t.TypeOf<typeof instance_ref_schema>[] = [];
    protected constructor(file: OwnedFile) {
        super(file);
    }
    public async getInstance(id: UUID): Promise<Instance> {
        if (!this._instances[id]) {
            if (this._instance_refs.includes(id)) {
                this._instances[id] = await Instance.loadInstanceFromFile(this, `${WORLD_DIR}/inst-${id}`, await File.acquireFile(`${WORLD_DIR}/inst-${id}.json`));
            } else {
                throw new Error(`No such instance as {id:${id}}!`);
            }
        }
        return this._instances[id];
    }

    public get schema() {
        return World.schema;
    }
    protected async fromJSON(json: WorldSchema): Promise<void> {
        this._instance_refs = [...json.instances];
    }
    protected toJSON(): WorldSchema {
        throw new Error('Method not implemented.');
    }
}
