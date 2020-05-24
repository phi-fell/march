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

export interface ArmorData {
    coverage: number;
    resilience: number;
    armor: number;
    slot: 'WEAPON' | 'SHIELD' | 'HELMET' | 'CHEST_ARMOR' | 'LEG_ARMOR' | 'BOOTS' | 'GLOVES' | 'BELT' | 'NECKLACE' | 'RING' | 'RING_ALT';
}

export interface WeaponData {
    one_handed: boolean;
    piercing: number;
    sharpness: number;
    force: number;
    precision: number;
    speed: number;
    attack_animation: string;
}

export interface Item {
    id: string;
    name: string;
    sprite: string;
    stackable: boolean;
    count: number;
    armor_data?: ArmorData;
    weapon_data?: WeaponData;
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
        item_data?: Item;
    }
    animation_playing?: string;
    animation_start_time?: number;
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
