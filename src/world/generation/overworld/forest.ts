import { Random } from '../../../math/random';
import { getTileFromName, getTileProps } from '../../../tile';
import { Board } from '../../board';
import type { GeneratableCell } from '../../cell';
import type { CellGenerator } from '../cellgeneration';

export class ForestGenerator implements CellGenerator {
    private rand: Random = new Random();
    private flood: boolean[][] = [];

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
                const xs = ((i / (board.width - 1)) - 0.5) * 2;
                const ys = ((j / (board.height - 1)) - 0.5) * 2;
                let scale = (xs * xs) + (ys * ys);
                scale = scale * scale;
                const rand = Random.float();
                if (rand > scale + 0.05) {
                    board.tiles[i][j] = getTileFromName('grass');
                } else if (rand > scale) {
                    board.tiles[i][j] = getTileFromName('dirt');
                } else if (rand > scale / 3) {
                    board.tiles[i][j] = getTileFromName('bush');
                } else {
                    board.tiles[i][j] = getTileFromName('tree');
                }
            }
        }

        this.flood = [];
        for (let i = 0; i < board.width; i++) {
            this.flood[i] = [];
            for (let j = 0; j < board.height; j++) {
                this.flood[i][j] = false;
            }
        }
        this.floodFill(board, Math.floor(board.width / 2), Math.floor(board.height / 2));

        for (let i = 0; i < board.width; i++) {
            for (let j = 0; j < board.height; j++) {
                if (!this.flood[i][j] && (board.tiles[i][j] === getTileFromName('grass') || board.tiles[i][j] === getTileFromName('dirt'))) {
                    board.tiles[i][j] = getTileFromName('tree');
                }
            }
        }
    }

    private floodFill(board: Board, x: number, y: number) {
        if (x < 0 || y < 0 || x >= this.flood.length || y >= this.flood[x].length || this.flood[x][y]) {
            return;
        }
        if (getTileProps(board.tiles[x][y]).passable) {
            this.flood[x][y] = true;
            this.floodFill(board, x + 1, y);
            this.floodFill(board, x, y + 1);
            this.floodFill(board, x - 1, y);
            this.floodFill(board, x, y - 1);
        }
    }
}
