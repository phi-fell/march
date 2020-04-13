import * as t from 'io-ts';

import { File, OwnedFile } from '../system/file';
import { FileBackedData } from '../system/file_backed_data';
import { Instance } from './instance';

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
    private _instance_refs: Array<t.TypeOf<typeof instance_ref_schema>[] = [];
    protected constructor(file: OwnedFile) {
        super(file);
    }
    public async getInstance(id: string): Promise<Instance | undefined> {
        if (!this._instances[id]) {
            if (this._instance_refs.includes(id)) {
                this._instances[id] = await Instance.loadInstanceFromFile(await File.acquireFile('world/inst-' + id + '.json'));
            } else {
                return;
            }
        }
        return this._instances[id];
    }

    public get schema(): t.Any {
        return World.schema;
    }
    protected async fromJSON(json: WorldSchema): Promise<void> {
        this._instance_refs = [...json.instances];
    }
    protected toJSON(): WorldSchema {
        throw new Error('Method not implemented.');
    }
}
