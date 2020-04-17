import type { GeneratableCell } from '../../cell';
import { CellGenerator } from '../cellgeneration';

export class SlimeMazeGenerator extends CellGenerator {
    public process(cell: GeneratableCell): GeneratableCell {
        return cell;
    }
}
