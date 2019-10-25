import { Instance } from '../instance';
import { getRandomAdjacency } from '../instanceschema';
import { Location } from '../location';
import { Random } from '../math/random';
import { Portal } from '../portal';
import { getTileFromName } from '../tile';

export function generate_SLIME_CAVE(inst: Instance) {
    for (let i = 0; i < inst.attributes.width; i++) {
        for (let j = 0; j < inst.attributes.height; j++) {
            inst.tiles[i][j] = getTileFromName('stone_wall');
        }
    }
    doPartition(inst, 1, 1, inst.attributes.width - 1, inst.attributes.height - 1);
    let stairNum = Math.floor(Random.float() * 3) + 2;
    while (stairNum > 0) {
        const sx = Math.floor(Random.float() * inst.attributes.width);
        const sy = Math.floor(Random.float() * inst.attributes.height);
        if (sx > 0 && sx < inst.attributes.width - 1 && sy > 0 && sy < inst.attributes.height - 1) {
            let sqr = true;
            for (let a = -1; a <= 1; a++) {
                for (let b = -1; b <= 1; b++) {
                    sqr = sqr && inst.tiles[sx + a][sy + b] === getTileFromName('stone_floor');
                }
            }
            if (sqr) {
                const loc = new Location(sx, sy, inst.id);
                let overlap = false;
                for (const portal of inst.portals) {
                    if (portal.location.equals(loc)) {
                        overlap = true;
                    }
                }
                if (!overlap) {
                    inst.portals.push(new Portal(loc, getRandomAdjacency(inst.attributes.schemaID)));
                    stairNum--;
                }
            }
        }
    }
    for (const portal of inst.portals) {
        inst.tiles[portal.location.x][portal.location.y] = getTileFromName('stone_stairs');
    }
}

interface PartitionInfo {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
}

function doRoom(inst: Instance, xmin: number, ymin: number, xmax: number, ymax: number): PartitionInfo {
    const w = Math.floor(Random.float() * 5) + 5;
    const h = Math.floor(Random.float() * 5) + 5;
    const x = Math.floor(Random.float() * ((xmax - w) - xmin)) + xmin;
    const y = Math.floor(Random.float() * ((ymax - w) - ymin)) + ymin;
    for (let i = x; i < x + w; i++) {
        for (let j = y; j < y + h; j++) {
            inst.tiles[i][j] = getTileFromName('stone_floor');
        }
    }
    return {
        'xmin': x,
        'ymin': y,
        'xmax': x + w,
        'ymax': y + h,
    };
}

function doPartition(inst: Instance, xmin: number, ymin: number, xmax: number, ymax: number): PartitionInfo {
    const hviable = xmax - xmin >= 20;
    const vviable = ymax - ymin >= 20;
    if (!hviable && !vviable) {
        return doRoom(inst, xmin, ymin, xmax, ymax);
    }
    let partition_orientation = Math.floor(Random.float() * 2);
    if (!hviable) {
        partition_orientation = 1;
    }
    if (!vviable) {
        partition_orientation = 0;
    }
    let p1;
    let p2;
    if (partition_orientation === 0) {
        // horizontal
        const xdivide = Math.floor(Random.float() * ((xmax - xmin) - 20)) + xmin + 10;
        p1 = doPartition(inst, xmin, ymin, xdivide, ymax);
        p2 = doPartition(inst, xdivide, ymin, xmax, ymax);
        const min = Math.max(p1.ymin, p2.ymin);
        const max = Math.min(p1.ymax, p2.ymax);
        if (min < max) {
            const y = Random.int(min, max);

            inst.tiles[xdivide][y] = getTileFromName('stone_floor');

            let x1 = xdivide;
            while (inst.tiles[x1 - 1][y] !== getTileFromName('stone_floor')) {
                x1--;
                inst.tiles[x1][y] = getTileFromName('stone_floor');
            }

            let x2 = xdivide;
            while (inst.tiles[x2 + 1][y] !== getTileFromName('stone_floor')) {
                x2++;
                inst.tiles[x2][y] = getTileFromName('stone_floor');
            }
        } else {
            const y1 = Random.int(p1.ymin, p1.ymax);
            const y2 = Random.int(p2.ymin, p2.ymax);

            for (let j = Math.min(y1, y2); j <= Math.max(y1, y2); j++) {
                inst.tiles[xdivide][j] = getTileFromName('stone_floor');
            }

            let x1 = xdivide;
            while (inst.tiles[x1 - 1][y1] !== getTileFromName('stone_floor')) {
                x1--;
                inst.tiles[x1][y1] = getTileFromName('stone_floor');
            }

            let x2 = xdivide;
            while (inst.tiles[x2 + 1][y2] !== getTileFromName('stone_floor')) {
                x2++;
                inst.tiles[x2][y2] = getTileFromName('stone_floor');
            }
        }
    } else {
        // vertical
        const ydivide = Math.floor(Random.float() * ((ymax - ymin) - 20)) + ymin + 10;
        p1 = doPartition(inst, xmin, ymin, xmax, ydivide);
        p2 = doPartition(inst, xmin, ydivide, xmax, ymax);

        const min = Math.max(p1.xmin, p2.xmin);
        const max = Math.min(p1.xmax, p2.xmax);
        if (min < max) {
            const x = Random.int(min, max);

            inst.tiles[x][ydivide] = getTileFromName('stone_floor');

            let y1 = ydivide;
            while (inst.tiles[x][y1 - 1] !== getTileFromName('stone_floor')) {
                y1--;
                inst.tiles[x][y1] = getTileFromName('stone_floor');
            }

            let y2 = ydivide;
            while (inst.tiles[x][y2 + 1] !== getTileFromName('stone_floor')) {
                y2++;
                inst.tiles[x][y2] = getTileFromName('stone_floor');
            }
        } else {
            const x1 = Random.int(p1.ymin, p1.ymax);
            const x2 = Random.int(p2.ymin, p2.ymax);

            for (let i = Math.min(x1, x2); i <= Math.max(x1, x2); i++) {
                inst.tiles[i][ydivide] = getTileFromName('stone_floor');
            }

            let y1 = ydivide;
            while (inst.tiles[x1][y1 - 1] !== getTileFromName('stone_floor')) {
                y1--;
                inst.tiles[x1][y1] = getTileFromName('stone_floor');
            }

            let y2 = ydivide;
            while (inst.tiles[x2][y2 + 1] !== getTileFromName('stone_floor')) {
                y2++;
                inst.tiles[x2][y2] = getTileFromName('stone_floor');
            }
        }
    }
    return {
        'xmin': Math.min(p1.xmin, p2.xmin),
        'ymin': Math.min(p1.ymin, p2.ymin),
        'xmax': Math.max(p1.xmax, p2.xmax),
        'ymax': Math.max(p1.ymax, p2.ymax),
    };
}
