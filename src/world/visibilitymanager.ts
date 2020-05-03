import * as t from 'io-ts';
import type { Entity } from './entity';
import type { Location } from './location';

export class VisibilityManager {
    public static schema = t.any;
    public static fromJSON(json: any) {
        return new VisibilityManager();
    }
    public canSee(loc: Location) {
        return true;
    }
    public toJSON() {
        return 'Any';
    }
    public getClientJSON(viewer: Entity): undefined {
        return;
    }
}
