import type { GeneratableCell } from '../cell';
import { SlimeAbyssGenerator } from './slime_tunnels/abyss';
import { SlimeCaveGenerator } from './slime_tunnels/cave';
import { SlimeMazeGenerator } from './slime_tunnels/maze';

export enum CELL_GENERATION {
    SLIME_CAVE,
    SLIME_MAZE,
    SLIME_ABYSS,
}

export interface CellGenerator {
    process(cell: GeneratableCell): GeneratableCell;
}

export class CellGeneration {
    private static generators: Record<CELL_GENERATION, new () => CellGenerator> = [
        SlimeCaveGenerator,
        SlimeAbyssGenerator,
        SlimeMazeGenerator,
    ];
    public static generateCell(cell: GeneratableCell) {
        const generator_class = CellGeneration.generators[cell.attributes.type];
        if (generator_class === undefined) {
            throw new Error(`No registered generator found as ${cell.attributes.type} (${CELL_GENERATION[cell.attributes.type]})!`);
        }
        const generator = new generator_class();
        return generator.process(cell);
    }
}
