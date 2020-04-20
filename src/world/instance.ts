import { promises as fs } from 'fs';
import * as t from 'io-ts';
import { Random, UUID } from '../math/random';
import { File, OwnedFile } from '../system/file';
import { FileBackedData } from '../system/file_backed_data';
import { Cell } from './cell';
import type { CellAttributes } from './generation/cellattributes';
import type { World } from './world';

const cell_ref_schema = t.string;

export type InstanceSchema = t.TypeOf<typeof Instance.schema>;

export class Instance extends FileBackedData {
    public static schema = t.type({
        'id': t.string,
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
    public static async createInstance(world: World, id: UUID, dir: string, file: OwnedFile) {
        const json: InstanceSchema = {
            id,
            'cells': [],
        };
        file.setJSON(json);
        const inst = new Instance(world, dir, file);
        await fs.mkdir(dir);
        await inst.ready();
        return inst;
    }

    public id: UUID = '';
    private cells: Record<UUID, Cell> = {};
    private cells_loading: Record<UUID, Promise<Cell>> = {};
    private cell_refs: t.TypeOf<typeof cell_ref_schema>[] = [];
    protected constructor(public world: World, private directory: string, file: OwnedFile) {
        super(file);
    }
    public async update(): Promise<void> {
        await Promise.all(Object.values(this.cells).map((cell: Cell) => cell.update()));
    }
    public async getCell(id: UUID): Promise<Cell> {
        if (!this.cells[id]) {
            if (this.cell_refs.includes(id)) {
                if (this.cells_loading[id]) {
                    return this.cells_loading[id];
                }
                this.cells_loading[id] = (async () => {
                    this.cells[id] = await Cell.loadCellFromFile(this, await File.acquireFile(`${this.directory}/cell-${id}.json`));
                    return this.cells[id];
                })();
                await this.cells_loading[id];
                delete this.cells_loading[id];
            } else {
                throw new Error(`No such cell as {id:${id}}!`);
            }
        }
        return this.cells[id];
    }
    public async createCell(attributes: CellAttributes): Promise<Cell> {
        const id = Cell.generateNewID();
        const cell: Cell = await Cell.createCell(this, id, await File.acquireFile(`${this.directory}/cell-${id}.json`), attributes);
        this.cell_refs.push(id);
        this.cells[id] = cell;
        return cell;
    }
    public get schema() {
        return Instance.schema;
    }
    protected async fromJSON(json: InstanceSchema): Promise<void> {
        this.id = json.id;
        this.cell_refs = [...json.cells];
    }
    protected toJSON(): InstanceSchema {
        return {
            'id': this.id,
            'cells': this.cell_refs,
        }
    }
    protected async prepForUnload(): Promise<void> {
        await Promise.all(Object.entries(this.cells).map(([id, cell]) => cell.unload()));
        this.cells = {};
    }
}
