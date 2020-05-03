export interface Location {
    x: number;
    y: number;
}

export enum DIRECTION {
    NORTH,
    WEST,
    SOUTH,
    EAST,
}

export enum RELATIVE_DIRECTION {
    FORWARD,
    LEFT,
    BACKWARD,
    RIGHT,
}

export interface Entity {
    id: string;
    location: Location;
    components: {
        direction?: keyof typeof DIRECTION;
        sheet?: any;
        sprite?: string;
        name?: string;
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
