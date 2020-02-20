import { OwnedFile } from './file';

export abstract class FileBackedData {
    private constructionPromise?: Promise<any>;
    protected constructor(private file: OwnedFile) {
        const fbdata = this;
        this.constructionPromise = Promise.resolve().then(() => { fbdata.fromJSON(file.getJSON()); });
    }
    public async ready() {
        if (this.constructionPromise) {
            await this.constructionPromise;
            this.constructionPromise = undefined;
        }
    }
    public save() {
        this.file.setJSON(this.toJSON());
    }
    /** Should be called when this object is no longer needed, before GC */
    public async unload() {
        return Promise.all([this.file.release(), this.cleanup()]);
    }
    protected abstract async fromJSON(json: any): Promise<void>;
    protected abstract toJSON(): any;
    /** does any necessary cleanup.  called by unload(), override in subclass if cleanup is needed */
    protected abstract async cleanup(): Promise<void>;
}
