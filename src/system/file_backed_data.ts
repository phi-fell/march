import * as t from 'io-ts';
import type { OwnedFile } from './file';
import { SchemaParser } from './schema_parser';


export abstract class FileBackedData {
    public static schema: t.Any = t.unknown;

    private constructionPromise?: Promise<unknown>;
    protected constructor(private file: OwnedFile) {
        // the following lines use a promise so that the constructor of a subclass will not override values set in .fromJSON()
        this.constructionPromise = Promise.resolve().then(async () => {
            const data = (new SchemaParser(this.schema)).parse(file.getJSON());
            if (data.isValid()) {
                await this.fromJSON(data.getValue());
            } else {
                data.printErrors();
            }
        });
    }
    public abstract get schema(): t.Any;
    public async ready() {
        if (this.constructionPromise) {
            await this.constructionPromise;
            this.constructionPromise = undefined;
        }
    }
    public async save() {
        return this.file.setJSON(this.toJSON());
    }
    /** Should be called when this object is no longer needed, before GC */
    public async unload() {
        await this.prepForUnload();
        await this.save();
        await this.file.release();
        await this.cleanup();
    }
    protected abstract async fromJSON(json: unknown): Promise<void>;
    protected abstract toJSON(): unknown;
    /** does any necessary cleanup.  called by unload(), override in subclass if cleanup is needed */
    protected async cleanup(): Promise<void> { /* override in subclass if needed */ }
    /** Called right before the meat of unload(), override in subclass for a pre-unload hook */
    protected async prepForUnload(): Promise<void> { /* override in subclass if needed */ }
}
