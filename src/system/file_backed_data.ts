import { OwnedFile } from './file';

export abstract class FileBackedData {
    protected constructor(private file: OwnedFile) {
        this.fromJSON(file.getJSON());
    }
    public save() {
        this.file.setJSON(this.toJSON());
    }
    /** Should be called when this object is no longer needed, before GC */
    public async unload() {
        return Promise.all([this.file.release(), this.cleanup()]);
    }
    protected abstract fromJSON(json: any): void;
    protected abstract toJSON(): any;
    /** does any necessary cleanup.  called by unload(), override in subclass if cleanup is needed */
    protected abstract async cleanup(): Promise<void>;
}
