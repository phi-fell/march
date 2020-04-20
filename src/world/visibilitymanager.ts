import type { Location } from './location';

export class VisibilityManager {
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
