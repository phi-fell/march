import { InstanceAttributes, Instance, TILE } from "./instance";

export enum INSTANCE_GEN_TYPE {
    EMPTY,
    ONE_ROOM,
    MAZE,
}

function maze(inst: Instance, x: number, y: number) {
    if (x <= 0 || y <= 0 || x >= inst.attributes.width - 1 || y >= inst.attributes.height - 1 || inst.tiles[x][y] == TILE.STONE_FLOOR) {
        return false;
    }
    inst.tiles[x][y] = TILE.STONE_FLOOR;
    let dirsleft = [true, true, true, true];
    while (dirsleft[0] || dirsleft[1] || dirsleft[2] || dirsleft[3]) {
        let dir = Math.floor(Math.random() * 4);
        if (dirsleft[dir]) {
            if (dir == 0) {
                if (maze(inst, x + 4, y)) {
                    for (let i = 0; i < 4; i++) {
                        inst.tiles[x + i][y] = TILE.STONE_FLOOR;
                    }
                }
            } else if (dir == 1) {
                if (maze(inst, x, y + 4)) {
                    for (let i = 0; i < 4; i++) {
                        inst.tiles[x][y + i] = TILE.STONE_FLOOR;
                    }
                }
            } else if (dir == 2) {
                if (maze(inst, x - 4, y)) {
                    for (let i = 0; i < 4; i++) {
                        inst.tiles[x - i][y] = TILE.STONE_FLOOR;
                    }
                }
            } else if (dir == 3) {
                if (maze(inst, x, y - 4)) {
                    for (let i = 0; i < 4; i++) {
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
                let x = Math.max((4 * Math.floor(Math.random() * ((inst.attributes.width / 4) - 1))) + 1, 1);
                let y = Math.max((4 * Math.floor(Math.random() * ((inst.attributes.height / 4) - 1))) + 1, 1);
                maze(inst, x, y);
                break;
            default:
                console.log('INVALID INSTANCE GENERATION TYPE!');
                break;
        }
    }
}