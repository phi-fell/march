import { Random, UUID } from '../math/random';
import { OwnedFile, File } from '../system/file';
import { FileBackedData } from '../system/file_backed_data';
import { Cell } from './cell';
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
    public static async loadInstanceFromFile(world: World, dir: string, file: OwnedFile) {
        const inst = new Instance(world, dir, file);
        await inst.ready();
        return inst;
    }

    private cells: Record<UUID, Cell> = {};
    private cell_refs: t.TypeOf<typeof cell_ref_schema>[] = [];
    protected constructor(public world: World, private directory: string, file: OwnedFile, public id: string = Instance.generateNewID()) {
        super(file);
    }
    public async getCell(id: UUID): Promise<Cell> {
        if (!this.cells[id]) {
            if (this.cell_refs.includes(id)) {
                this.cells[id] = await Cell.loadCellFromFile(this, await File.acquireFile(`${this.directory}/cell-${id}.json`));
            } else {
                throw Error(`No such cell as {id:${id}}!`);
            }
        }
        return this.cells[id];
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
