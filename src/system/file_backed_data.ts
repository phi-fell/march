import * as t from 'io-ts';

import type { OwnedFile } from './file';

export abstract class FileBackedData {
    public static schema: t.Any = t.unknown;

    private constructionPromise?: Promise<unknown>;
    protected constructor(private file: OwnedFile) {
        const fbdata = this;
        // the following lines use a promise so that the constructor of a subclass will not override values set in .fromJSON()
        this.constructionPromise = Promise.resolve().then(async () => {
            const json = file.getJSON();
            if (this.schema.is(json)) {
                await fbdata.fromJSON(json);
            } else {
                console.log('Invalid FileBackedData JSON!');
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
        await this.save();
        await this.file.release();
        await this.cleanup();
    }
    protected abstract async fromJSON(json: unknown): Promise<void>;
    protected abstract toJSON(): unknown;
    /** does any necessary cleanup.  called by unload(), override in subclass if cleanup is needed */
    protected async cleanup(): Promise<void> { /* override in subclass if needed */ }
}
