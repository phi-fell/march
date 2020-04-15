import { promises as fs } from 'fs';
import path = require('path');

import { NoThrow } from '../error/nothrow';

export interface ReadOnlyFile {
    getString(): string;
    getJSON(): unknown;
}

class ReadOnlyFileImpl implements ReadOnlyFile {
    private data: string = '';
    private loadPromise: Promise<unknown>;
    public constructor(private id: string) {
        this.loadPromise = this.loadFromDisk();
    }
    public async ready() {
        return this.loadPromise;
    }
    public getString() {
        return this.data;
    }
    public getJSON() {
        return JSON.parse(this.data);
    }
    private async loadFromDisk() {
        this.data = (await fs.readFile(this.id)).toString();
    }
}

export class File {
    public static async exists(filepath: string): Promise<boolean> {
        filepath = path.resolve(filepath);
        try {
            await fs.access(filepath);
        } catch {
            return false;
        }
        return true;
    }
    public static async getReadOnlyFile(filepath: string): Promise<ReadOnlyFile> {
        filepath = path.resolve(filepath);
        if (File.owned_files[filepath]) {
            throw new Error('cannot read owned file!');
        }
        const f = new ReadOnlyFileImpl(filepath);
        await f.ready();
        return f;
    }
    public static async acquireFile(filepath: string): Promise<OwnedFile> {
        filepath = path.resolve(filepath);
        if (File.owned_files[filepath]) {
            throw new Error('cannot acquire already owned file!');
        }
        File.owned_files[filepath] = new OwnedFileImpl(filepath);
        await File.owned_files[filepath].ready();
        return File.owned_files[filepath];
    }
    public static async releaseFile(f: OwnedFile) {
        await f.flush();
        delete File.owned_files[f.id];
    }
    private static owned_files: { [id: string]: OwnedFileImpl } = {};
}

export interface OwnedFile {
    readonly id: string;
    release(): Promise<unknown>;
    flush(): Promise<unknown>;
    getString(): string;
    getJSON(): unknown;
    setString(s: string): Promise<unknown>;
    setJSON(json: unknown): Promise<unknown>;
}

class OwnedFileImpl implements OwnedFile {

    private data?: string;
    private jsonCache?: unknown;
    private loadPromise: Promise<unknown>;
    private savePromise?: Promise<unknown>;
    private modified: boolean = false;

    public constructor(private _id: string) {
        this.loadPromise = this.loadFromDisk();
    }
    public get id() {
        return this._id;
    }
    public async ready() {
        return this.loadPromise;
    }
    public async flush() {
        return this.savePromise;
    }
    public async release() {
        File.releaseFile(this);
    }
    public getString() {
        if (!this.data) {
            throw new Error('Cannot read nonexistent file!: ' + this._id);
        }
        return this.data;
    }
    public getJSON() {
        if (!this.data) {
            throw new Error('Cannot read nonexistent file!: ' + this._id);
        }
        if (!this.jsonCache) {
            this.jsonCache = JSON.parse(this.data);
        }
        return this.jsonCache;
    }
    public async setString(s: string) {
        this.jsonCache = undefined;
        this.data = s;
        this.modified = true;
        return this.saveToDisk();
    }
    public async setJSON(json: unknown) {
        this.jsonCache = json;
        this.data = JSON.stringify(json);
        this.modified = true;
        return this.saveToDisk();
    }
    private async loadFromDisk() {
        try {
            this.data = (await fs.readFile(this._id)).toString();
        } catch {
            // ignore error, setString and setJSON will still work and will create the file, reads that happen before that will fail
        }
    }
    @NoThrow
    private async saveToDisk() {
        if (!this.modified) {
            return this.savePromise; // no changes to save
        }
        if (this.savePromise) {
            this.savePromise = this.savePromise.then(() => fs.writeFile(this._id, this.data));
        } else {
            this.savePromise = fs.writeFile(this._id, this.data);
        }
        this.savePromise.catch((error) => {
            console.log(error);
        });
        this.modified = false;
        const p = this.savePromise;
        await p;
        if (p === this.savePromise) {
            this.savePromise = undefined;
        }
    }
}
