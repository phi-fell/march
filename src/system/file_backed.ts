import { isRight } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { File, OwnedFile } from './file';

class Test {
    public static schema = t.string;
    public static fromJSON() {
        return new Test();
    }
    public toJSON() {
        return '';
    }
}

enum FILE_BACKED_STATE {
    LOADING,
    LOAD_FAILED, // ?
    LOADED,
    UNLOADING,
    UNLOAD_FAILED, // ?
    UNLOADED,
}

interface FileBackableClass<S extends t.Any, T extends FileBackable<S> = FileBackable<S>> {
    schema: S;
    fromJSON(json: t.TypeOf<S>): T;
}

interface FileBackable<S extends t.Any> {
    toJSON(): t.TypeOf<S>;
}

export class FileBacked<S extends t.Any, C extends FileBackableClass<S>> {
    private load_state: FILE_BACKED_STATE = FILE_BACKED_STATE.LOADING;
    private loadPromise?: Promise<void>;
    private held?: ReturnType<C['fromJSON']>;
    private file?: OwnedFile;
    public constructor(backed_class: C, schema: C['schema'], private path: string) {
        this.loadPromise = (async () => {
            try {
                this.file = await File.acquireFile(path);
                const raw_json = this.file.getJSON();
                const json = schema.decode(raw_json);
                if (isRight(json)) {
                    this.held = backed_class.fromJSON(json) as ReturnType<C['fromJSON']>;
                    this.load_state = FILE_BACKED_STATE.LOADED;
                    this.loadPromise = undefined;
                } else {
                    this.load_state = FILE_BACKED_STATE.LOAD_FAILED;
                    console.log('Invalid FileBackedData JSON!');
                    for (const err of json.left) {
                        console.log(err);
                    }
                }
            } catch (err) {
                this.load_state = FILE_BACKED_STATE.LOAD_FAILED;
                console.log(err);
                this.file?.release();
                this.file = undefined;
            }
        })();
    }
    public get state() {
        return this.load_state;
    }
    public getHeld() {
        if (this.load_state === FILE_BACKED_STATE.LOADED) {
            return this.held;
        }
    }
    public async unload(): Promise<void> {
        if (this.load_state !== FILE_BACKED_STATE.LOADED) {
            return;
        }
        this.load_state = FILE_BACKED_STATE.UNLOADING;
        this.file?.setJSON(this.held?.toJSON());
    }
}

const fb = new FileBacked(Test, Test.schema, '');













export abstract class FileBackedData {
    public static schema: t.Any = t.unknown;

    private constructionPromise?: Promise<unknown>;
    protected constructor(private file: OwnedFile) {
        const fbdata = this;
        // the following lines use a promise so that the constructor of a subclass will not override values set in .fromJSON()
        this.constructionPromise = Promise.resolve().then(async () => {
            const raw_json = file.getJSON();
            const json = this.schema.decode(raw_json);
            if (isRight(json)) {
                await fbdata.fromJSON(json.right);
            } else {
                console.log('Invalid FileBackedData JSON!');
                for (const err of json.left) {
                    console.log(err);
                }
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
