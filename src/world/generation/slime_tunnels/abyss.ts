import type { GeneratableCell } from '../../cell';
import { CellGenerator } from '../cellgeneration';

export class SlimeAbyssGenerator extends CellGenerator {
    public process(cell: GeneratableCell): GeneratableCell {
        return cell;
    }
}
