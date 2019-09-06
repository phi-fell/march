import { Instance } from "./instance";
import { getTileFromName } from "./tile";

export enum INSTANCE_GEN_TYPE {
    EMPTY,
    ONE_ROOM,
    MAZE,
    ROOMS,
    BASIC_DUNGEON,
    FOREST,
    VOLCANIC,
}

function maze(inst: Instance, x: number, y: number) {
    const STRIDE = 2;
    if (x <= 0
        || y <= 0
        || x >= inst.attributes.width - 1
        || y >= inst.attributes.height - 1
        || inst.tiles[x][y] === getTileFromName("stone_floor")) {
        return false;
    }
    inst.tiles[x][y] = getTileFromName("stone_floor");
    const dirsleft = [true, true, true, true];
    while (dirsleft[0] || dirsleft[1] || dirsleft[2] || dirsleft[3]) {
        const dir = Math.floor(Math.random() * 4);
        if (dirsleft[dir]) {
            if (dir === 0) {
                if (maze(inst, x + STRIDE, y)) {
                    for (let i = 0; i < STRIDE; i++) {
                        inst.tiles[x + i][y] = getTileFromName("stone_floor");
                    }
                }
            } else if (dir === 1) {
                if (maze(inst, x, y + STRIDE)) {
                    for (let i = 0; i < STRIDE; i++) {
                        inst.tiles[x][y + i] = getTileFromName("stone_floor");
                    }
                }
            } else if (dir === 2) {
                if (maze(inst, x - STRIDE, y)) {
                    for (let i = 0; i < STRIDE; i++) {
                        inst.tiles[x - i][y] = getTileFromName("stone_floor");
                    }
                }
            } else if (dir === 3) {
                if (maze(inst, x, y - STRIDE)) {
                    for (let i = 0; i < STRIDE; i++) {
                        inst.tiles[x][y - i] = getTileFromName("stone_floor");
                    }
                }
            }
            dirsleft[dir] = false;
        }
    }
    return true;
}

export class InstanceGenerator {
    static runGeneration(inst: Instance) {
        switch (inst.attributes.genType) {
            case INSTANCE_GEN_TYPE.EMPTY:
                for (var i = 0; i < inst.attributes.width; i++) {
                    for (var j = 0; j < inst.attributes.height; j++) {
                        inst.tiles[i][j] = getTileFromName("stone_floor");
                    }
                }
                break;
            case INSTANCE_GEN_TYPE.ONE_ROOM:
                for (var i = 0; i < inst.attributes.width; i++) {
                    for (var j = 0; j < inst.attributes.height; j++) {
                        if (i === 0 || j === 0 || i === inst.attributes.width - 1 || j === inst.attributes.height - 1) {
                            inst.tiles[i][j] = getTileFromName("stone_wall");
                        } else {
                            inst.tiles[i][j] = getTileFromName("stone_floor");
                        }
                    }
                }
                break;
            case INSTANCE_GEN_TYPE.MAZE:
                for (var i = 0; i < inst.attributes.width; i++) {
                    for (var j = 0; j < inst.attributes.height; j++) {
                        inst.tiles[i][j] = getTileFromName("stone_wall");
                    }
                }
                const STRIDE = 2;
                let x = Math.max((STRIDE * Math.floor(Math.random() * ((inst.attributes.width / STRIDE) - 1))) + 1, 1);
                let y = Math.max((STRIDE * Math.floor(Math.random() * ((inst.attributes.height / STRIDE) - 1))) + 1, 1);
                maze(inst, x, y);
                break;
            case INSTANCE_GEN_TYPE.ROOMS:
                doROOMS(inst);
                break;
            case INSTANCE_GEN_TYPE.BASIC_DUNGEON:
                doBASIC_DUNGEON(inst);
                break;
            case INSTANCE_GEN_TYPE.FOREST:
                //doFOREST(inst);
                break;
            case INSTANCE_GEN_TYPE.VOLCANIC:
                //doVOLCANIC(inst);
                break;
            default:
                console.log('INVALID INSTANCE GENERATION TYPE!');
                break;
        }
    }
}

function doSingleRoom(inst: Instance): boolean {
    const w = (Math.floor(Math.random() * 4) * 2) + 5;
    const h = (Math.floor(Math.random() * 4) * 2) + 5;
    const x = (Math.floor((Math.random() * (inst.attributes.width - (w + 2))) / 2) * 2) + 1;
    const y = (Math.floor((Math.random() * (inst.attributes.height - (h + 2))) / 2) * 2) + 1;
    for (let i = -1; i < w + 1; i++) {
        for (let j = -1; j < h + 1; j++) {
            if (inst.tiles[x + i][y + j] !== getTileFromName("stone_wall")) {
                return false;
            }
        }
    }
    for (let i = 0; i < w; i++) {
        for (let j = 0; j < h; j++) {
            inst.tiles[x + i][y + j] = getTileFromName("stone_floor");
        }
    }
    return true;
}

function floodFill(inst: Instance, flood: number[][], id: number, x: number, y: number) {
    if (x < 0 || y < 0 || x >= inst.attributes.width || y >= inst.attributes.height) {
        return; // bounds check
    }
    if (flood[x][y] === id || inst.tiles[x][y] !== getTileFromName("stone_floor")) {
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
        const i = Math.floor(Math.random() * conCount);
        inst.tiles[conX[i]][conY[i]] = getTileFromName("stone_floor");
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
            if (flood[x][y] === -1 && inst.tiles[x][y] === getTileFromName("stone_floor")) {
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
    if (inst.tiles[x][y] === getTileFromName("stone_floor")) {
        let wallcount = 0;
        if (inst.tiles[x + 1][y] === getTileFromName("stone_wall")) {
            wallcount++;
        }
        if (inst.tiles[x - 1][y] === getTileFromName("stone_wall")) {
            wallcount++;
        }
        if (inst.tiles[x][y + 1] === getTileFromName("stone_wall")) {
            wallcount++;
        }
        if (inst.tiles[x][y - 1] === getTileFromName("stone_wall")) {
            wallcount++;
        }
        if (wallcount === 3) {
            inst.tiles[x][y] = getTileFromName("stone_wall");
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
            inst.tiles[i][j] = getTileFromName("stone_wall");
        }
    }
    const count = (inst.attributes.width * inst.attributes.height) / 100;
    for (let _i = 0; _i < count; _i++) {
        const w = Math.floor(Math.random() * 5) + 5;
        const h = Math.floor(Math.random() * 5) + 5;
        const x = Math.floor(Math.random() * (inst.attributes.width - (w + 2))) + 1;
        const y = Math.floor(Math.random() * (inst.attributes.height - (h + 2))) + 1;
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                inst.tiles[x + i][y + j] = getTileFromName("stone_floor");
            }
        }
    }
}

function doBASIC_DUNGEON(inst: Instance) {
    for (let i = 0; i < inst.attributes.width; i++) {
        for (let j = 0; j < inst.attributes.height; j++) {
            inst.tiles[i][j] = getTileFromName("stone_wall");
        }
    }
    const count = (inst.attributes.width * inst.attributes.height) / 100;
    for (let _i = 0; _i < count; _i++) {
        doSingleRoom(inst);
    }
    let stairNum = Math.floor(Math.random() * 3) + 1;
    while (stairNum > 0) {
        const sx = Math.floor(Math.random() * inst.attributes.width);
        const sy = Math.floor(Math.random() * inst.attributes.height);
        if (inst.tiles[sx][sy] === getTileFromName("stone_floor")) {
            inst.tiles[sx][sy] = getTileFromName("stone_stairs");
            stairNum--;
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
}