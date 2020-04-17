import type { GeneratableCell } from '../../cell';
import type { CellGenerator } from '../cellgeneration';

export class SlimeAbyssGenerator implements CellGenerator {
    public process(cell: GeneratableCell): GeneratableCell {
        return cell;
    }
}
