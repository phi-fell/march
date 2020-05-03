
export interface Entity {
    id: string;
    location: {
        x: number;
        y: number;
    };
    components: {
        direction?: 'NORTH' | 'EAST' | 'WEST' | 'SOUTH';
        sheet?: any;
        sprite?: string;
    }
}

export interface Board {
    x: number,
    y: number,
    width: number,
    height: number,
    tiles: number[][],
    tileAdjacencies: number[][],
    entities: Entity[]
}
