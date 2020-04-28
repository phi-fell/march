import { Random } from '../../../math/random';
import { getTileFromName } from '../../../tile';
import { Board } from '../../board';
import type { GeneratableCell } from '../../cell';
import type { CellGenerator } from '../cellgeneration';

const CHANCE = 0.55;
const CUTOFF = 5;
const STEPS = 4;

export class SlimeAbyssGenerator implements CellGenerator {
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
        const boolmap = this.getBoolMap(board.width, board.height);
        for (let i = 0; i < board.width; i++) {
            for (let j = 0; j < board.height; j++) {
                board.tiles[i][j] = (boolmap[i][j]) ? getTileFromName('stone_floor') : getTileFromName('stone_wall');
            }
        }
    }

    private getBoolMap(w: number, h: number) {
        let ret: boolean[][] = [];
        for (let i = -1; i <= w; i++) {
            ret[i] = [];
            for (let j = -1; j <= h; j++) {
                if (i === -1 || i === w || j === -1 || j === h) {
                    ret[i][j] = false;
                } else {
                    ret[i][j] = this.rand.float() < CHANCE;
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
}
