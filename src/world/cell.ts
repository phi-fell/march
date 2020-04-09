import { Random } from '../math/random';
import { Board } from './board';

export class Cell {
    public static generateNewID() {
        return Random.uuid();
    }
    private board: Board;
    constructor(public id: string = Cell.generateNewID()) {
        this.board = new Board(0, 0);
    }
}
