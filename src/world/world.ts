import * as t from 'io-ts';

import type { OwnedFile } from '../system/file';
import { FileBackedData } from '../system/file_backed_data';
import type { Instance } from './instance';

const instance_ref_schema = t.type({
    'id': t.string,
});

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
    protected constructor(file: OwnedFile) {
        super(file);
    }

    public get schema(): t.Any {
        return World.schema;
    }
    protected async fromJSON(json: WorldSchema): Promise<void> {
        // TODO: load instances
    }
    protected toJSON(): WorldSchema {
        throw new Error('Method not implemented.');
    }
}
