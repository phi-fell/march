import type { Instance } from './old_instance';
import { generate_SLIME_ABYSS } from './instance_generation/slime_abyss';
import { generate_SLIME_CAVE } from './instance_generation/slime_cave';
import { generate_SLIME_MAZE } from './instance_generation/slime_maze.';
import { getRandomAdjacency } from './instanceschema';
import { Location } from './old_location';
import { Random } from './math/random';
import { Portal } from './portal';
import { getTileFromName } from './tile';

export enum INSTANCE_GEN_TYPE {
    EMPTY,
    ONE_ROOM,
    MAZE,
    ROOMS,
    BASIC_DUNGEON,
    FOREST,
    SLIME_CAVE,
    SLIME_MAZE,
    SLIME_ABYSS,
    VOLCANIC,
}

export class InstanceGenerator {
    public static runGeneration(inst: Instance) {
        Random.reSeed(inst.attributes.seed);
        switch (inst.attributes.genType) {
            case INSTANCE_GEN_TYPE.EMPTY:
                for (let i = 0; i < inst.attributes.width; i++) {
                    for (let j = 0; j < inst.attributes.height; j++) {
                        inst.tiles[i][j] = getTileFromName('stone_floor');
                    }
                }
                break;
            case INSTANCE_GEN_TYPE.ONE_ROOM:
                for (let i = 0; i < inst.attributes.width; i++) {
                    for (let j = 0; j < inst.attributes.height; j++) {
                        if (i === 0 || j === 0 || i === inst.attributes.width - 1 || j === inst.attributes.height - 1) {
                            inst.tiles[i][j] = getTileFromName('stone_wall');
                        } else {
                            inst.tiles[i][j] = getTileFromName('stone_floor');
                        }
                    }
                }
                inst.tiles[6][6] = getTileFromName('stone_stairs');
                inst.portals.push(new Portal(new Location(6, 6, inst.id), 'slime_cave/upper'));
                break;
            case INSTANCE_GEN_TYPE.MAZE:
                for (let i = 0; i < inst.attributes.width; i++) {
                    for (let j = 0; j < inst.attributes.height; j++) {
                        inst.tiles[i][j] = getTileFromName('stone_wall');
                    }
                }
                const STRIDE = 2;
                const x = Math.max((STRIDE * Math.floor(Random.float() * ((inst.attributes.width / STRIDE) - 1))) + 1, 1);
                const y = Math.max((STRIDE * Math.floor(Random.float() * ((inst.attributes.height / STRIDE) - 1))) + 1, 1);
                maze(inst, x, y);
                break;
            case INSTANCE_GEN_TYPE.ROOMS:
                doROOMS(inst);
                break;
            case INSTANCE_GEN_TYPE.BASIC_DUNGEON:
                doBASIC_DUNGEON(inst);
                break;
            case INSTANCE_GEN_TYPE.SLIME_CAVE:
                generate_SLIME_CAVE(inst);
                break;
            case INSTANCE_GEN_TYPE.SLIME_MAZE:
                generate_SLIME_MAZE(inst);
                break;
            case INSTANCE_GEN_TYPE.SLIME_ABYSS:
                generate_SLIME_ABYSS(inst);
                break;
            case INSTANCE_GEN_TYPE.FOREST:
                doFOREST(inst);
                break;
            case INSTANCE_GEN_TYPE.VOLCANIC:
                doVOLCANIC(inst);
                break;
            default:
                console.log('INVALID INSTANCE GENERATION TYPE!');
                break;
        }
    }
}

function maze(inst: Instance, x: number, y: number) {
    const STRIDE = 2;
    if (x <= 0
        || y <= 0
        || x >= inst.attributes.width - 1
        || y >= inst.attributes.height - 1
        || inst.tiles[x][y] === getTileFromName('stone_floor')) {
        return false;
    }
    inst.tiles[x][y] = getTileFromName('stone_floor');
    const dirsleft = [true, true, true, true];
    while (dirsleft[0] || dirsleft[1] || dirsleft[2] || dirsleft[3]) {
        const dir = Math.floor(Random.float() * 4);
        if (dirsleft[dir]) {
            switch (dir) {
                case 0: {
                    if (maze(inst, x + STRIDE, y)) {
                        for (let i = 0; i < STRIDE; i++) {
                            inst.tiles[x + i][y] = getTileFromName('stone_floor');
                        }
                    }
                } case 1: {
                    if (maze(inst, x, y + STRIDE)) {
                        for (let i = 0; i < STRIDE; i++) {
                            inst.tiles[x][y + i] = getTileFromName('stone_floor');
                        }
                    }
                } case 2: {
                    if (maze(inst, x - STRIDE, y)) {
                        for (let i = 0; i < STRIDE; i++) {
                            inst.tiles[x - i][y] = getTileFromName('stone_floor');
                        }
                    }
                } case 3: {
                    if (maze(inst, x, y - STRIDE)) {
                        for (let i = 0; i < STRIDE; i++) {
                            inst.tiles[x][y - i] = getTileFromName('stone_floor');
                        }
                    }
                }
            }
            dirsleft[dir] = false;
        }
    }
    return true;
}

function doSingleRoom(inst: Instance): boolean {
    const w = (Math.floor(Random.float() * 4) * 2) + 5;
    const h = (Math.floor(Random.float() * 4) * 2) + 5;
    const x = (Math.floor((Random.float() * (inst.attributes.width - (w + 2))) / 2) * 2) + 1;
    const y = (Math.floor((Random.float() * (inst.attributes.height - (h + 2))) / 2) * 2) + 1;
    for (let i = -1; i < w + 1; i++) {
        for (let j = -1; j < h + 1; j++) {
            if (inst.tiles[x + i][y + j] !== getTileFromName('stone_wall')) {
                return false;
            }
        }
    }
    for (let i = 0; i < w; i++) {
        for (let j = 0; j < h; j++) {
            inst.tiles[x + i][y + j] = getTileFromName('stone_floor');
        }
    }
    return true;
}

function floodFill(inst: Instance, flood: number[][], id: number, x: number, y: number) {
    if (x < 0 || y < 0 || x >= inst.attributes.width || y >= inst.attributes.height) {
        return; // bounds check
    }
    if (flood[x][y] === id || inst.tiles[x][y] !== getTileFromName('stone_floor')) {
        return; // no repeats, obstructed by walls
    }
    flood[x][y] = id;
    floodFill(inst, flood, id, x - 1, y);
    floodFill(inst, flood, id, x + 1, y);
    floodFill(inst, flood, id, x, y - 1);
    floodFill(inst, flood, id, x, y + 1);
}

function connectRegion(inst: Instance, flood: number[][], id: number) {
    let conCount = 0;
    const conX: number[] = [];
    const conY: number[] = [];
    for (let x = 1; x < inst.attributes.width - 1; x++) {
        for (let y = 1; y < inst.attributes.height - 1; y++) {
            if (flood[x][y] === -1) {
                const adjToReg = flood[x + 1][y] === id
                    || flood[x - 1][y] === id
                    || flood[x][y + 1] === id
                    || flood[x][y - 1] === id;
                const adjToOther = (flood[x + 1][y] !== id && flood[x + 1][y] !== -1)
                    || (flood[x - 1][y] !== id && flood[x - 1][y] !== -1)
                    || (flood[x][y + 1] !== id && flood[x][y + 1] !== -1)
                    || (flood[x][y - 1] !== id && flood[x][y - 1] !== -1);
                if (adjToReg && adjToOther) {
                    conX.push(x);
                    conY.push(y);
                    conCount++;
                }
            }
        }
    }
    const doCons = conCount * 0.05;
    for (let j = 0; j < doCons; j++) {
        const i = Math.floor(Random.float() * conCount);
        inst.tiles[conX[i]][conY[i]] = getTileFromName('stone_floor');
        floodFill(inst, flood, id, conX[i], conY[i]);
        conX.splice(i, 1);
        conY.splice(i, 1);
        conCount--;
    }
}

function ensureConnectedness(inst: Instance) {
    const flood: number[][] = [];
    for (let i = 0; i < inst.attributes.width; i++) {
        flood[i] = [];
        for (let j = 0; j < inst.attributes.height; j++) {
            flood[i][j] = -1;
        }
    }
    let id = 0;
    for (let x = 0; x < inst.attributes.width; x++) {
        for (let y = 0; y < inst.attributes.height; y++) {
            if (flood[x][y] === -1 && inst.tiles[x][y] === getTileFromName('stone_floor')) {
                floodFill(inst, flood, id, x, y);
                id++;
            }
        }
    }
    for (let a = 0; a < id; a++) {
        connectRegion(inst, flood, a);
    }
}

function pruneLeaf(inst: Instance, x: number, y: number) {
    if (inst.tiles[x][y] === getTileFromName('stone_floor')) {
        let wallcount = 0;
        if (inst.tiles[x + 1][y] === getTileFromName('stone_wall')) {
            wallcount++;
        }
        if (inst.tiles[x - 1][y] === getTileFromName('stone_wall')) {
            wallcount++;
        }
        if (inst.tiles[x][y + 1] === getTileFromName('stone_wall')) {
            wallcount++;
        }
        if (inst.tiles[x][y - 1] === getTileFromName('stone_wall')) {
            wallcount++;
        }
        if (wallcount === 3) {
            inst.tiles[x][y] = getTileFromName('stone_wall');
            pruneLeaf(inst, x + 1, y);
            pruneLeaf(inst, x - 1, y);
            pruneLeaf(inst, x, y + 1);
            pruneLeaf(inst, x, y - 1);
        }
    }
}

function prune(inst: Instance) {
    for (let i = 0; i < inst.attributes.width; i++) {
        for (let j = 0; j < inst.attributes.height; j++) {
            pruneLeaf(inst, i, j);
        }
    }
}

function doROOMS(inst: Instance) {
    for (let i = 0; i < inst.attributes.width; i++) {
        for (let j = 0; j < inst.attributes.height; j++) {
            inst.tiles[i][j] = getTileFromName('stone_wall');
        }
    }
    const count = (inst.attributes.width * inst.attributes.height) / 100;
    for (let _i = 0; _i < count; _i++) {
        const w = Math.floor(Random.float() * 5) + 5;
        const h = Math.floor(Random.float() * 5) + 5;
        const x = Math.floor(Random.float() * (inst.attributes.width - (w + 2))) + 1;
        const y = Math.floor(Random.float() * (inst.attributes.height - (h + 2))) + 1;
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                inst.tiles[x + i][y + j] = getTileFromName('stone_floor');
            }
        }
    }
}

function doBASIC_DUNGEON(inst: Instance) {
    for (let i = 0; i < inst.attributes.width; i++) {
        for (let j = 0; j < inst.attributes.height; j++) {
            inst.tiles[i][j] = getTileFromName('stone_wall');
        }
    }
    const count = (inst.attributes.width * inst.attributes.height) / 100;
    for (let _i = 0; _i < count; _i++) {
        doSingleRoom(inst);
    }
    let stairNum = Math.floor(Random.float() * 3) + 1;
    while (stairNum > 0) {
        const sx = Math.floor(Random.float() * inst.attributes.width);
        const sy = Math.floor(Random.float() * inst.attributes.height);
        if (inst.tiles[sx][sy] === getTileFromName('stone_floor')) {
            const loc = new Location(sx, sy, inst.id);
            let overlap = false;
            for (const portal of inst.portals) {
                if (portal.location.equals(loc)) {
                    overlap = true;
                }
            }
            if (!overlap) {
                inst.portals.push(new Portal(loc, inst.attributes.schemaID));
                stairNum--;
            }
        }
    }
    const STRIDE = 2;
    for (let x = 1; x < inst.attributes.width; x += STRIDE) {
        for (let y = 1; y < inst.attributes.height; y += STRIDE) {
            maze(inst, x, y);
        }
    }
    ensureConnectedness(inst);
    prune(inst);
    for (const portal of inst.portals) {
        inst.tiles[portal.location.x][portal.location.y] = getTileFromName('stone_stairs');
    }
}
function forestFlood(inst: Instance, vals: boolean[][], x: number, y: number) {
    if (x < 0 || y < 0 || x >= vals.length || y >= vals[0].length || vals[x][y]) {
        return;
    }
    if (inst.isTilePassable(x, y)) {
        vals[x][y] = true;
        forestFlood(inst, vals, x + 1, y);
        forestFlood(inst, vals, x, y + 1);
        forestFlood(inst, vals, x - 1, y);
        forestFlood(inst, vals, x, y - 1);
    }
}

function doFOREST(inst: Instance) {
    for (let i = 0; i < inst.attributes.width; i++) {
        for (let j = 0; j < inst.attributes.height; j++) {
            const xs = ((i / (inst.attributes.width - 1)) - 0.5) * 2;
            const ys = ((j / (inst.attributes.height - 1)) - 0.5) * 2;
            let scale = (xs * xs) + (ys * ys);
            scale = scale * scale;
            const rand = Random.float();
            if (rand > scale + 0.05) {
                inst.tiles[i][j] = getTileFromName('grass');
            } else if (rand > scale) {
                inst.tiles[i][j] = getTileFromName('dirt');
            } else if (rand > scale / 3) {
                inst.tiles[i][j] = getTileFromName('bush');
            } else {
                inst.tiles[i][j] = getTileFromName('tree');
            }
        }
    }

    const flood: boolean[][] = [];
    for (let i = 0; i < inst.attributes.width; i++) {
        flood[i] = [];
        for (let j = 0; j < inst.attributes.height; j++) {
            flood[i][j] = false;
        }
    }
    forestFlood(inst, flood, Math.floor(inst.attributes.width / 2), Math.floor(inst.attributes.height / 2));

    let stairNum = Math.floor(Random.float() * 3) + 2;
    while (stairNum > 0) {
        const sx = Math.floor(Random.float() * inst.attributes.width);
        const sy = Math.floor(Random.float() * inst.attributes.height);
        if (flood[sx][sy]) {
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
    for (const portal of inst.portals) {
        inst.tiles[portal.location.x][portal.location.y] = getTileFromName('stone_stairs');
    }
}

function doVOLCANIC(inst: Instance) {
    for (let i = 0; i < inst.attributes.width; i++) {
        for (let j = 0; j < inst.attributes.height; j++) {
            const rand = Random.float();
            if (rand < 0.6) {
                inst.tiles[i][j] = getTileFromName('ash');
            } else if (rand < 0.8) {
                inst.tiles[i][j] = getTileFromName('basalt');
            } else if (rand < 0.999) {
                inst.tiles[i][j] = getTileFromName('lava');
            } else {
                inst.tiles[i][j] = getTileFromName('obsidian_spire');
            }
        }
    }
}
