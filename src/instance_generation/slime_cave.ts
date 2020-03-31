import type { Instance } from '../instance';
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
    const w = Random.int(5, 10);
    const h = Random.int(5, 10);
    const x = Random.int(xmin, xmax - w);
    const y = Random.int(ymin, ymax - h);
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

function connect(inst: Instance, roomA: PartitionInfo, roomB: PartitionInfo) {
    let x0;
    let y0;
    do {
        x0 = Random.int(roomA.xmin, roomA.xmax);
        y0 = Random.int(roomA.ymin, roomA.ymax);
    } while (inst.tiles[x0][y0] !== getTileFromName('stone_floor'));
    let x1;
    let y1;
    do {
        x1 = Random.int(roomB.xmin, roomB.xmax);
        y1 = Random.int(roomB.ymin, roomB.ymax);
    } while (inst.tiles[x1][y1] !== getTileFromName('stone_floor'));
    const dx = (x0 < x1) ? 1 : (-1);
    const dy = (y0 < y1) ? 1 : (-1);
    let i = x0;
    let j = y0;
    for (i = x0; i !== x1; i += dx) {
        inst.tiles[i][j] = getTileFromName('stone_floor');
    }
    for (j = y0; j !== y1; j += dy) {
        inst.tiles[i][j] = getTileFromName('stone_floor');
    }
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
    } else {
        // vertical
        const ydivide = Math.floor(Random.float() * ((ymax - ymin) - 20)) + ymin + 10;
        p1 = doPartition(inst, xmin, ymin, xmax, ydivide);
        p2 = doPartition(inst, xmin, ydivide, xmax, ymax);
    }
    if (Random.float() < 0.5) {
        connect(inst, p1, p2);
    } else {
        connect(inst, p2, p1);
    }
    return {
        'xmin': Math.min(p1.xmin, p2.xmin),
        'ymin': Math.min(p1.ymin, p2.ymin),
        'xmax': Math.max(p1.xmax, p2.xmax),
        'ymax': Math.max(p1.ymax, p2.ymax),
    };
}
