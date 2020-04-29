import type * as t from 'io-ts';
import { File } from './file';

export type ResourceClass<S extends t.Any, T extends Resource<S>> = new (id: string) => T;

export abstract class ResourceManager<S extends t.Any, T extends Resource<S>> {
    private res: { [id: string]: T } = {};
    protected abstract resource_class: ResourceClass<S, T>;
    constructor(private dir: string, private extension: string = '.json') { }
    public async get(id: string): Promise<T | undefined> {
        if (this.res[id] === undefined) {
            try {
                this.res[id] = new this.resource_class(this.dir + '/' + id + this.extension);
                await this.res[id].ready();
            } catch (err) {
                console.log(err);
                return;
            }
        } else {
            try {
                await this.res[id].ready();
            } catch (err) {
                return;
            }
        }
        return this.res[id];
    }
}

export abstract class Resource<T extends t.Any> {
    private loadPromise: Promise<any>;
    public constructor(protected path: string) {
        this.loadPromise = this.load();
    }
    public abstract fromJSON(json: t.TypeOf<T>): void;
    public abstract toJSON(): t.TypeOf<T>;
    public async ready() {
        return this.loadPromise;
    }
    private async load() {
        this.fromJSON((await File.getReadOnlyFile(this.path)).getJSON());
    }
}
