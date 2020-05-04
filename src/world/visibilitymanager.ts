import * as t from 'io-ts';
import { getTileProps } from '../tile';
import type { Entity } from './entity';
import type { Location } from './location';

const MAX_VISION_RADIUS = 15;

export class VisibilityManager {
    public static schema = t.any;
    public static fromJSON(json: any) {
        return new VisibilityManager();
    }
    private width: number = 0;
    private height: number = 0;
    private visible: boolean[][] = [];
    private loc_cache?: Location | undefined;
    public toJSON() {
        return 'Any';
    }
    public getClientJSON(viewer: Entity): undefined {
        return;
    }
    public getVisibilityMap(entity: Entity) {
        this.calculateVisibility(entity);
        return this.visible;
    }
    private calculateVisibility(entity: Entity) {
        if (this.loc_cache !== undefined && entity.location.equals(this.loc_cache)) {
            return;
        }
        this.loc_cache = entity.location
        this.width = entity.location.cell.attributes.width;
        this.height = entity.location.cell.attributes.height;
        this.visible = this.getTileVisibility(entity.location, MAX_VISION_RADIUS, entity)
    }
    private getTileVisibility(loc: Location, RADIUS: number, ent: Entity): boolean[][] {
        const visible: boolean[][] = [];
        for (let i = 0; i < this.width; i++) {
            visible[i] = [];
            for (let j = 0; j < this.height; j++) {
                if (i >= loc.x - RADIUS &&
                    i <= loc.x + RADIUS &&
                    j >= loc.y - RADIUS &&
                    j <= loc.y + RADIUS
                ) {
                    visible[i][j] = true;
                } else {
                    visible[i][j] = false;
                }
            }
        }
        this.shadowCast(ent, visible, loc.x, loc.y, RADIUS, 1, true);
        this.shadowCast(ent, visible, loc.x, loc.y, RADIUS, -1, true);
        this.shadowCast(ent, visible, loc.x, loc.y, RADIUS, 1, false);
        this.shadowCast(ent, visible, loc.x, loc.y, RADIUS, -1, false);
        return visible;
    }
    private addShadow(shadows: any, start: number, end: number) {
        for (let i = 0; i < shadows.length; i++) {
            // check if entirely contained in existing shadow
            if (start >= shadows[i].start && end <= shadows[i].end) {
                return; // included in existing shadow
            }
            // check if is entirely to left of existing
            if (end < shadows[i].start) {
                shadows.splice(i, 0, {
                    'start': start,
                    'end': end,
                });
                return;
            }
            // check if merges from the left
            if (start <= shadows[i].start) {
                // extend to left
                shadows[i].start = start;
                return;
            }
            // check if overlaps on the left
            if (start <= shadows[i].end) {
                // overlaps shadow on left
                if (end > shadows[i].end) {
                    // extend
                    shadows[i].end = end;
                    // attempt merge
                    if (i + 1 < shadows.length && end >= shadows[i + 1].start) {
                        // overlaps on right
                        if (shadows[i + 1].end > shadows[i].end) {
                            shadows[i].end = shadows[i + 1].end;
                        }
                        shadows.splice(i + 1, 0);
                    }
                }
                return;
            }
        }
        // insert into array
        shadows.push({
            'start': start,
            'end': end,
        });
    }
    private shadowCast(ent: Entity, visible: boolean[][], px: number, py: number, radius: number, sign: number, vertical: boolean) {
        const COVERAGE_THRESHOLD = 0.99;
        const pa = vertical ? px : py;
        const pb = vertical ? py : px;
        const shadows: any[] = [];
        for (let r = 0; r <= radius; r++) {
            const b = pb + (r * sign);
            for (let a = pa - r; a <= pa + r; a++) {
                const x = vertical ? a : b;
                const y = vertical ? b : a;
                if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
                    let coverage: number = 0;
                    for (const s of shadows) {
                        const start = ((a - (pa - r)) / (r + r + 1));
                        const end = (((a + 1) - (pa - r)) / (r + r + 1));
                        if (start >= s.start && end <= s.end) {
                            coverage += 1;
                            visible[x][y] = false;
                        } else if (start < s.start && end > s.start) {
                            coverage += end - s.start;
                        } else if (start < s.end && end > s.end) {
                            coverage += s.end - start;
                        }
                    }
                    if (coverage >= COVERAGE_THRESHOLD) {
                        visible[x][y] = false;
                    }
                }
            }
            for (let a = pa - r; a <= pa + r; a++) {
                const x = vertical ? a : b;
                const y = vertical ? b : a;
                if (x >= 0 && y >= 0 && x < this.width && y < this.height && getTileProps(ent.location.cell.getTileAt(x, y)).obstruction) {
                    const start = (a - (pa - r)) / (r + r + 1);
                    const end = ((a + 1) - (pa - r)) / (r + r + 1);
                    this.addShadow(shadows, start, end);
                }
            }
            if (r > 0) {
                const r_prev = r - 1;
                const b_prev = pb + (r_prev * sign);
                for (let a_prev = pa - r_prev; a_prev <= pa + r_prev; a_prev++) {
                    const x = vertical ? a_prev : b_prev;
                    const y = vertical ? b_prev : a_prev;
                    if (x >= 0 && y >= 0 && x < this.width && y < this.height && getTileProps(ent.location.cell.getTileAt(x, y)).obstruction) {
                        const start = (a_prev - (pa - r)) / (r + r + 1);
                        const end = ((a_prev + 1) - (pa - r)) / (r + r + 1);
                        this.addShadow(shadows, start, end);
                    }
                }
            }
        }
    }
}
