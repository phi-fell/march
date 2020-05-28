import type { GeneratableCell } from '../cell';
import { OneRoomGenerator } from './basic/one_room';
import { ForestGenerator } from './overworld/forest';
import { SlimeAbyssGenerator } from './slime_tunnels/abyss';
import { SlimeCaveGenerator } from './slime_tunnels/cave';
import { SlimeMazeGenerator } from './slime_tunnels/maze';
import { TutorialGenerator } from './tutorial';

export enum CELL_GENERATION {
    ONE_ROOM,
    TUTORIAL,
    FOREST,
    SLIME_CAVE,
    SLIME_MAZE,
    SLIME_ABYSS,
}

export interface CellGenerator {
    process(cell: GeneratableCell): GeneratableCell;
}

export class CellGeneration {
    private static generators: Record<CELL_GENERATION, new () => CellGenerator> = [
        OneRoomGenerator,
        TutorialGenerator,
        ForestGenerator,
        SlimeCaveGenerator,
        SlimeAbyssGenerator,
        SlimeMazeGenerator,
    ];
    public static generateCell(cell: GeneratableCell) {
        const generator = new CellGeneration.generators[cell.attributes.type]();
        return generator.process(cell);
    }
}
