import type { GeneratableCell } from '../../cell';
import type { CellGenerator } from '../cellgeneration';

export class SlimeMazeGenerator implements CellGenerator {
    public process(cell: GeneratableCell): GeneratableCell {
        return cell;
    }
}
