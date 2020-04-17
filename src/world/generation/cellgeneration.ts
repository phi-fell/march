import type { GeneratableCell } from '../cell';
import { SlimeAbyssGenerator } from './slime_tunnels/abyss';
import { SlimeCaveGenerator } from './slime_tunnels/cave';
import { SlimeMazeGenerator } from './slime_tunnels/maze';

export enum CELL_GENERATION {
    SLIME_CAVE,
    SLIME_MAZE,
    SLIME_ABYSS,
}

export abstract class CellGenerator {
    private static generators: Record<CELL_GENERATION, new () => CellGenerator> = [
        SlimeCaveGenerator,
        SlimeMazeGenerator,
        SlimeAbyssGenerator,
    ];
    public static generateCell(cell: GeneratableCell) {
        const generator = new CellGenerator.generators[cell.attributes.type]();
        return generator.process(cell);
    }
    abstract process(cell: GeneratableCell): GeneratableCell;
}
