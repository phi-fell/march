import { isRight } from 'fp-ts/lib/Either';
import type * as t from 'io-ts';

export interface ValidParsedJSON<T> {
    isValid(): this is ValidParsedJSON<T>;
    getValue(): T;
}
export interface InvalidParsedJSON<T> {
    isValid(): this is ValidParsedJSON<T>
    getErrors(): t.Errors;
    printErrors(): void;
    printErrorsAndThrow(): never;
}
export type UnknownParsedJSON<T> = ValidParsedJSON<T> | InvalidParsedJSON<T>;

class ParsedJSON<T>{
    constructor(private json: T | undefined, private errs: t.Errors | undefined) {
    }
    public isValid(): this is ValidParsedJSON<T> {
        return this.json !== undefined && this.errs === undefined;
    }
    public getValue(): T | undefined {
        return this.json;
    }
    public getErrors() {
        return this.errs;
    }
    public printErrors() {
        if (this.json === undefined || this.errs !== undefined) {
            console.log('Invalid Schema JSON!');
        }
        if (this.errs !== undefined) {
            for (const err of this.errs) {
                console.log(err);
            }
        }
    }
    public printErrorsAndThrow() {
        this.printErrors();
        if (this.json === undefined || this.errs !== undefined) {
            throw new Error('Invalid Schema JSON!');
        }
    }
}

export class SchemaParser<T extends t.Any> {
    constructor(private schema: T) { }
    public parse(data: any): UnknownParsedJSON<t.TypeOf<T>> {
        const json = this.schema.decode(data);
        if (isRight(json)) {
            return new ParsedJSON(json.right, undefined);
        }
        return new ParsedJSON<T>(undefined, json.left);
    }
}
