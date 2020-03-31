import type { Instance } from '../instance';
import { getRandomAdjacency } from '../instanceschema';
import { Location } from '../location';
import { Random } from '../math/random';
import { Portal } from '../portal';
import { getTileFromName } from '../tile';

const CHANCE = 0.55;
const CUTOFF = 5;
const STEPS = 4;

export function generate_SLIME_ABYSS(inst: Instance) {
    const boolmap = getBoolMap(inst.attributes.width, inst.attributes.height);
    for (let i = 0; i < inst.attributes.width; i++) {
        for (let j = 0; j < inst.attributes.height; j++) {
            inst.tiles[i][j] = (boolmap[i][j]) ? getTileFromName('stone_floor') : getTileFromName('stone_wall');
        }
    }
    let stairNum = 1;
    while (stairNum > 0) {
        const sx = Math.floor(Random.float() * inst.attributes.width);
        const sy = Math.floor(Random.float() * inst.attributes.height);
        if (inst.tiles[sx][sy] === getTileFromName('stone_floor')) {
            const loc = new Location(sx, sy, inst.id);
            inst.portals.push(new Portal(loc, getRandomAdjacency(inst.attributes.schemaID)));
            inst.tiles[sx][sy] = getTileFromName('stone_stairs');
            stairNum--;
        }
    }
}

function getBoolMap(w: number, h: number) {
    let ret: boolean[][] = [];
    for (let i = -1; i <= w; i++) {
        ret[i] = [];
        for (let j = -1; j <= h; j++) {
            if (i === -1 || i === w || j === -1 || j === h) {
                ret[i][j] = false;
            } else {
                ret[i][j] = Random.float() < CHANCE;
            }
        }
    }
    for (let s = 0; s < STEPS; s++) {
        const newmap: boolean[][] = [];
        for (let i = -1; i <= w; i++) {
            newmap[i] = [];
            for (let j = -1; j <= h; j++) {
                if (i <= 0 || i >= w - 1 || j <= 0 || j >= h - 1) {
                    newmap[i][j] = false;
                } else {
                    let count = 0;
                    for (let a = -1; a <= 1; a++) {
                        for (let b = -1; b <= 1; b++) {
                            if (ret[i + a][j + b]) {
                                count++;
                            }
                        }
                    }
                    newmap[i][j] = count >= CUTOFF;
                }
            }
        }
        ret = newmap;
    }
    return ret;
}
