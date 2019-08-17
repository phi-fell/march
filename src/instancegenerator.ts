import { InstanceAttributes, Instance, TILE } from "./instance";

export enum INSTANCE_GEN_TYPE {
    EMPTY,
    ONE_ROOM,
    MAZE,
    ROOMS,
}

function maze(inst: Instance, x: number, y: number) {
    const STRIDE = 2;
    if (x <= 0
        || y <= 0
        || x >= inst.attributes.width - 1
        || y >= inst.attributes.height - 1
        || inst.tiles[x][y] === TILE.STONE_FLOOR) {
        return false;
    }
    inst.tiles[x][y] = TILE.STONE_FLOOR;
    const dirsleft = [true, true, true, true];
    while (dirsleft[0] || dirsleft[1] || dirsleft[2] || dirsleft[3]) {
        const dir = Math.floor(Math.random() * 4);
        if (dirsleft[dir]) {
            if (dir === 0) {
                if (maze(inst, x + STRIDE, y)) {
                    for (let i = 0; i < STRIDE; i++) {
                        inst.tiles[x + i][y] = TILE.STONE_FLOOR;
                    }
                }
            } else if (dir === 1) {
                if (maze(inst, x, y + STRIDE)) {
                    for (let i = 0; i < STRIDE; i++) {
                        inst.tiles[x][y + i] = TILE.STONE_FLOOR;
                    }
                }
            } else if (dir === 2) {
                if (maze(inst, x - STRIDE, y)) {
                    for (let i = 0; i < STRIDE; i++) {
                        inst.tiles[x - i][y] = TILE.STONE_FLOOR;
                    }
                }
            } else if (dir === 3) {
                if (maze(inst, x, y - STRIDE)) {
                    for (let i = 0; i < STRIDE; i++) {
                        inst.tiles[x][y - i] = TILE.STONE_FLOOR;
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
                        inst.tiles[i][j] = TILE.STONE_FLOOR;
                    }
                }
                break;
            case INSTANCE_GEN_TYPE.ONE_ROOM:
                for (var i = 0; i < inst.attributes.width; i++) {
                    for (var j = 0; j < inst.attributes.height; j++) {
                        if (i === 0 || j === 0 || i === inst.attributes.width - 1 || j === inst.attributes.height - 1) {
                            inst.tiles[i][j] = TILE.STONE_WALL;
                        } else {
                            inst.tiles[i][j] = TILE.STONE_FLOOR;
                        }
                    }
                }
                break;
            case INSTANCE_GEN_TYPE.MAZE:
                for (var i = 0; i < inst.attributes.width; i++) {
                    for (var j = 0; j < inst.attributes.height; j++) {
                        inst.tiles[i][j] = TILE.STONE_WALL;
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
            default:
                console.log('INVALID INSTANCE GENERATION TYPE!');
                break;
        }
    }
}

function doROOMS(inst: Instance) {
    for (var i = 0; i < inst.attributes.width; i++) {
        for (var j = 0; j < inst.attributes.height; j++) {
            inst.tiles[i][j] = TILE.STONE_WALL;
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
                inst.tiles[x + i][y + j] = TILE.STONE_FLOOR;
            }
        }
    }
}