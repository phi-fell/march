import { getTileProps, Tile } from '../tile';
import type { Location } from '../world/location';

export class Instance {
    private width: number = 100;
    private height: number = 100;
    private tiles: Tile[][] = [];
    public getTileVisibility(loc: Location, RADIUS: number): boolean[][] {
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
        this.shadowCast(visible, loc.x, loc.y, RADIUS, 1, true);
        this.shadowCast(visible, loc.x, loc.y, RADIUS, -1, true);
        this.shadowCast(visible, loc.x, loc.y, RADIUS, 1, false);
        this.shadowCast(visible, loc.x, loc.y, RADIUS, -1, false);
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
    private shadowCast(visible: boolean[][], px: number, py: number, radius: number, sign: number, vertical: boolean) {
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
                if (x >= 0 && y >= 0 && x < this.width && y < this.height && getTileProps(this.tiles[x][y]).obstruction) {
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
                    if (x >= 0 && y >= 0 && x < this.width && y < this.height && getTileProps(this.tiles[x][y]).obstruction) {
                        const start = (a_prev - (pa - r)) / (r + r + 1);
                        const end = ((a_prev + 1) - (pa - r)) / (r + r + 1);
                        this.addShadow(shadows, start, end);
                    }
                }
            }
        }
    }
}
