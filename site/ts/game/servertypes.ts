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

export interface Item {
    id: string;
    name: string;
    sprite: string;
    count: number;
}

export type Inventory = Item[];

export interface Entity {
    id: string;
    location: Location;
    components: {
        direction?: keyof typeof DIRECTION;
        sheet?: any;
        sprite?: string;
        name?: string;
        inventory?: Inventory;
        portal?: unknown;
        item_data?: {
            name: string;
            stackable: boolean;
            count: number;
        };
    }
}

export interface Board {
    x: number;
    y: number;
    width: number;
    height: number;
    tiles: number[][];
    tileAdjacencies: number[][];
    fog_of_war: {
        width: number;
        height: number;
        visible: boolean[][];
    };
}
