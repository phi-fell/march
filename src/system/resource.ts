import { File } from './file';

export type ResourceClass<T extends Resource> = new (id: string) => T;

export class ResourceManager<T extends Resource> {
    private res: { [id: string]: T } = {};
    constructor(private resource_class: ResourceClass<T>, private dir: string, private extension: string = '.json') { }
    public async get(id: string) {
        if (!this.res[id]) {
            this.res[id] = new this.resource_class(this.dir + '/' + id + this.extension);
            await this.res[id].ready();
        }
        return this.res[id];
    }
}

export abstract class Resource {
    private loadPromise: Promise<any>;
    public constructor(protected path: string) {
        this.loadPromise = this.load();
    }
    public abstract fromJSON(json: any): void;
    public abstract toJSON(): any;
    public async ready() {
        return this.loadPromise;
    }
    private async load() {
        this.fromJSON((await File.getReadOnlyFile(this.path)).getJSON());
    }
}
