import * as t from 'io-ts';
import type { Location } from './location';

export class VisibilityManager {
    public static schema = t.any,
    public static fromJSON(json: any) {
        return new VisibilityManager();
    }
    public canSee(loc: Location) {
        return true;
    }
    public toJSON() {
        return 'Any';
    }
}
