import { Random } from '../../../math/random';
import { getTileFromName } from '../../../tile';
import { Board } from '../../board';
import type { GeneratableCell } from '../../cell';
import type { CellGenerator } from '../cellgeneration';

export class SlimeMazeGenerator implements CellGenerator {
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
        const count = (board.width * board.height) / 100;
        for (let _i = 0; _i < count; _i++) {
            this.doSingleRoom(board);
        }
        const STRIDE = 2;
        for (let x = 1; x < board.width; x += STRIDE) {
            for (let y = 1; y < board.height; y += STRIDE) {
                this.maze(board, x, y);
            }
        }
        this.ensureConnectedness(board);
        this.prune(board);
    }

    private maze(board: Board, x: number, y: number) {
        const STRIDE = 2;
        if (x <= 0
            || y <= 0
            || x >= board.width - 1
            || y >= board.height - 1
            || board.tiles[x][y] === getTileFromName('stone_floor')) {
            return false;
        }
        board.tiles[x][y] = getTileFromName('stone_floor');
        const dirsleft = [true, true, true, true];
        while (dirsleft[0] || dirsleft[1] || dirsleft[2] || dirsleft[3]) {
            const dir = this.rand.int(0, 4);
            if (dirsleft[dir]) {
                switch (dir) {
                    case 0: {
                        if (this.maze(board, x + STRIDE, y)) {
                            for (let i = 0; i < STRIDE; i++) {
                                board.tiles[x + i][y] = getTileFromName('stone_floor');
                            }
                        }
                    } case 1: {
                        if (this.maze(board, x, y + STRIDE)) {
                            for (let i = 0; i < STRIDE; i++) {
                                board.tiles[x][y + i] = getTileFromName('stone_floor');
                            }
                        }
                    } case 2: {
                        if (this.maze(board, x - STRIDE, y)) {
                            for (let i = 0; i < STRIDE; i++) {
                                board.tiles[x - i][y] = getTileFromName('stone_floor');
                            }
                        }
                    } case 3: {
                        if (this.maze(board, x, y - STRIDE)) {
                            for (let i = 0; i < STRIDE; i++) {
                                board.tiles[x][y - i] = getTileFromName('stone_floor');
                            }
                        }
                    }
                }
                dirsleft[dir] = false;
            }
        }
        return true;
    }

    private doSingleRoom(board: Board): boolean {
        const w = (this.rand.int(0, 4) * 2) + 5;
        const h = (this.rand.int(0, 4) * 2) + 5;
        const x = (this.rand.int(0, (board.width - (w + 2)) / 2) * 2) + 1;
        const y = (this.rand.int(0, (board.height - (h + 2)) / 2) * 2) + 1;
        for (let i = -1; i < w + 1; i++) {
            for (let j = -1; j < h + 1; j++) {
                if (board.tiles[x + i][y + j] !== getTileFromName('stone_wall')) {
                    return false;
                }
            }
        }
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                board.tiles[x + i][y + j] = getTileFromName('stone_floor');
            }
        }
        return true;
    }

    private floodFill(board: Board, flood: number[][], id: number, x: number, y: number) {
        if (x < 0 || y < 0 || x >= board.width || y >= board.height) {
            return; // bounds check
        }
        if (flood[x][y] === id || board.tiles[x][y] !== getTileFromName('stone_floor')) {
            return; // no repeats, obstructed by walls
        }
        flood[x][y] = id;
        this.floodFill(board, flood, id, x - 1, y);
        this.floodFill(board, flood, id, x + 1, y);
        this.floodFill(board, flood, id, x, y - 1);
        this.floodFill(board, flood, id, x, y + 1);
    }

    private connectRegion(board: Board, flood: number[][], id: number) {
        let conCount = 0;
        const conX: number[] = [];
        const conY: number[] = [];
        for (let x = 1; x < board.width - 1; x++) {
            for (let y = 1; y < board.height - 1; y++) {
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
            const i = this.rand.int(0, conCount);
            board.tiles[conX[i]][conY[i]] = getTileFromName('stone_floor');
            this.floodFill(board, flood, id, conX[i], conY[i]);
            conX.splice(i, 1);
            conY.splice(i, 1);
            conCount--;
        }
    }

    private ensureConnectedness(board: Board) {
        const flood: number[][] = [];
        for (let i = 0; i < board.width; i++) {
            flood[i] = [];
            for (let j = 0; j < board.height; j++) {
                flood[i][j] = -1;
            }
        }
        let id = 0;
        for (let x = 0; x < board.width; x++) {
            for (let y = 0; y < board.height; y++) {
                if (flood[x][y] === -1 && board.tiles[x][y] === getTileFromName('stone_floor')) {
                    this.floodFill(board, flood, id, x, y);
                    id++;
                }
            }
        }
        for (let a = 0; a < id; a++) {
            this.connectRegion(board, flood, a);
        }
    }

    private pruneLeaf(board: Board, x: number, y: number) {
        if (board.tiles[x][y] === getTileFromName('stone_floor')) {
            let wallcount = 0;
            if (board.tiles[x + 1][y] === getTileFromName('stone_wall')) {
                wallcount++;
            }
            if (board.tiles[x - 1][y] === getTileFromName('stone_wall')) {
                wallcount++;
            }
            if (board.tiles[x][y + 1] === getTileFromName('stone_wall')) {
                wallcount++;
            }
            if (board.tiles[x][y - 1] === getTileFromName('stone_wall')) {
                wallcount++;
            }
            if (wallcount === 3) {
                board.tiles[x][y] = getTileFromName('stone_wall');
                this.pruneLeaf(board, x + 1, y);
                this.pruneLeaf(board, x - 1, y);
                this.pruneLeaf(board, x, y + 1);
                this.pruneLeaf(board, x, y - 1);
            }
        }
    }

    private prune(board: Board) {
        for (let i = 0; i < board.width; i++) {
            for (let j = 0; j < board.height; j++) {
                this.pruneLeaf(board, i, j);
            }
        }
    }

}
