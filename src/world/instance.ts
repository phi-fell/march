import { Random } from '../math/random';
import type { OwnedFile } from '../system/file';
import { FileBackedData } from '../system/file_backed_data';
import type { Cell } from './cell';

export class Instance extends FileBackedData {
    public static generateNewID() {
        return Random.uuid();
    }
    public static async loadInstanceFromFile(file: OwnedFile) {
        const inst = new Instance(file);
        await inst.ready();
        return inst;
    }
    private cells: Cell[] = [];
    protected constructor(file: OwnedFile, public id: string = Instance.generateNewID()) {
        super(file);
    }
    public get schema(): import('io-ts').Any {
        throw new Error('Method not implemented.');
    }
    protected async fromJSON(json: unknown): Promise<void> {
        throw new Error('Method not implemented.');
    }
    protected toJSON(): unknown {
        throw new Error('Method not implemented.');
    }
}
