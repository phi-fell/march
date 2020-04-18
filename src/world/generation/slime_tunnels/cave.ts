import { Random } from '../../../math/random';
import { getTileFromName } from '../../../tile';
import { Board } from '../../board';
import type { GeneratableCell } from '../../cell';
import type { CellGenerator } from '../cellgeneration';

interface PartitionInfo {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
}

export class SlimeCaveGenerator implements CellGenerator {
    private rand: Random = new Random();
    public process(cell: GeneratableCell): GeneratableCell {
        const attr = cell.attributes;
        const board = new Board(attr.width, attr.height);
        this.rand.reSeed(attr.seed);
        this.generate(board);
        cell.setBoard(board);
        return cell;
    }
    private generate(board: Board) {
        for (let i = 0; i < board.width; i++) {
            for (let j = 0; j < board.height; j++) {
                board.tiles[i][j] = getTileFromName('stone_wall');
            }
        }
        this.doPartition(board, 1, 1, board.width - 1, board.height - 1);
        const stairNum = Math.floor(this.rand.float() * 3) + 2;
        // stairs should be an entity with a stair(?) component
        /*
        while (stairNum > 0) {
            const sx = Math.floor(this.rand.float() * board.width);
            const sy = Math.floor(this.rand.float() * board.height);
            if (sx > 0 && sx < board.width - 1 && sy > 0 && sy < board.height - 1) {
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
        */
    }

    private doRoom(board: Board, xmin: number, ymin: number, xmax: number, ymax: number): PartitionInfo {
        const w = this.rand.int(5, 10);
        const h = this.rand.int(5, 10);
        const x = this.rand.int(xmin, xmax - w);
        const y = this.rand.int(ymin, ymax - h);
        for (let i = x; i < x + w; i++) {
            for (let j = y; j < y + h; j++) {
                board.tiles[i][j] = getTileFromName('stone_floor');
            }
        }
        return {
            'xmin': x,
            'ymin': y,
            'xmax': x + w,
            'ymax': y + h,
        };
    }

    private connect(board: Board, roomA: PartitionInfo, roomB: PartitionInfo) {
        let x0;
        let y0;
        do {
            x0 = this.rand.int(roomA.xmin, roomA.xmax);
            y0 = this.rand.int(roomA.ymin, roomA.ymax);
        } while (board.tiles[x0][y0] !== getTileFromName('stone_floor'));
        let x1;
        let y1;
        do {
            x1 = this.rand.int(roomB.xmin, roomB.xmax);
            y1 = this.rand.int(roomB.ymin, roomB.ymax);
        } while (board.tiles[x1][y1] !== getTileFromName('stone_floor'));
        const dx = (x0 < x1) ? 1 : (-1);
        const dy = (y0 < y1) ? 1 : (-1);
        let i = x0;
        let j = y0;
        for (i = x0; i !== x1; i += dx) {
            board.tiles[i][j] = getTileFromName('stone_floor');
        }
        for (j = y0; j !== y1; j += dy) {
            board.tiles[i][j] = getTileFromName('stone_floor');
        }
    }

    private doPartition(board: Board, xmin: number, ymin: number, xmax: number, ymax: number): PartitionInfo {
        const hviable = xmax - xmin >= 20;
        const vviable = ymax - ymin >= 20;
        if (!hviable && !vviable) {
            return this.doRoom(board, xmin, ymin, xmax, ymax);
        }
        let partition_orientation = Math.floor(this.rand.float() * 2);
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
            const xdivide = Math.floor(this.rand.float() * ((xmax - xmin) - 20)) + xmin + 10;
            p1 = this.doPartition(board, xmin, ymin, xdivide, ymax);
            p2 = this.doPartition(board, xdivide, ymin, xmax, ymax);
        } else {
            // vertical
            const ydivide = Math.floor(this.rand.float() * ((ymax - ymin) - 20)) + ymin + 10;
            p1 = this.doPartition(board, xmin, ymin, xmax, ydivide);
            p2 = this.doPartition(board, xmin, ydivide, xmax, ymax);
        }
        if (this.rand.float() < 0.5) {
            this.connect(board, p1, p2);
        } else {
            this.connect(board, p2, p1);
        }
        return {
            'xmin': Math.min(p1.xmin, p2.xmin),
            'ymin': Math.min(p1.ymin, p2.ymin),
            'xmax': Math.max(p1.xmax, p2.xmax),
            'ymax': Math.max(p1.ymax, p2.ymax),
        };
    }
}
