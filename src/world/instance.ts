import { Random } from '../math/random';
import type { OwnedFile } from '../system/file';
import { FileBackedData } from '../system/file_backed_data';
import type { Cell } from './cell';
import * as t from 'io-ts';
import type { World } from './world';

const cell_ref_schema = t.string;

export type InstanceSchema = t.TypeOf<typeof Instance.schema>;

export class Instance extends FileBackedData {
    public static schema = t.type({
        'cells': t.array(cell_ref_schema),
    });
    public static generateNewID() {
        return Random.uuid();
    }
    public static async loadInstanceFromFile(world: World, file: OwnedFile) {
        const inst = new Instance(world, file);
        await inst.ready();
        return inst;
    }
    private cells: Cell[] = [];
    protected constructor(public world: World, file: OwnedFile, public id: string = Instance.generateNewID()) {
        super(file);
    }
    public get schema() {
        return Instance.schema;
    }
    protected async fromJSON(json: InstanceSchema): Promise<void> {
        throw new Error('Method not implemented.');
    }
    protected toJSON(): InstanceSchema {
        throw new Error('Method not implemented.');
    }
}
