import { Random } from '../../math/random';
import { getTileFromName } from '../../tile';
import { Board } from '../board';
import type { GeneratableCell } from '../cell';
import type { CellGenerator } from './cellgeneration';

export class TutorialGenerator implements CellGenerator {
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
                board.tiles[i][j] = getTileFromName('stone_wall')
            }
        }
        for (let i = 1; i < 4; i++) {
            for (let j = 1; j < 4; j++) {
                board.tiles[i][j] = getTileFromName('stone_floor')
            }
        }
    }
}
