import type { GeneratableCell } from '../cell';

export enum CELL_GENERATION {
    SLIME_CAVE,
    SLIME_MAZE,
    SLIME_ABYSS,
}

export abstract class CellGenerator {
    private static generators: ((new () => CellGenerator) | undefined)[] = [];
    public static registerGenerator(type: CELL_GENERATION, generator: new () => CellGenerator) {
        CellGenerator.generators[type] = generator;
    }
    public static generateCell(cell: GeneratableCell) {
        const generator_class = CellGenerator.generators[cell.attributes.type];
        if (generator_class === undefined) {
            throw new Error(`No registered generator found as ${cell.attributes.type} (${CELL_GENERATION[cell.attributes.type]})!`);
        }
        const generator = new generator_class();
        return generator.process(cell);
    }
    abstract process(cell: GeneratableCell): GeneratableCell;
}
