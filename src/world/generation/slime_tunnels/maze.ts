import type { GeneratableCell } from '../../cell';
import { CellGenerator, CELL_GENERATION } from '../cellgeneration';

export class SlimeMazeGenerator extends CellGenerator {
    public process(cell: GeneratableCell): GeneratableCell {
        return cell;
    }
}

CellGenerator.registerGenerator(CELL_GENERATION.SLIME_MAZE, SlimeMazeGenerator);
