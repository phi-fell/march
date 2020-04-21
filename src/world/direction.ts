export enum DIRECTION {
    NORTH,
    WEST,
    SOUTH,
    EAST,
}

export const directionVectors = [
    { 'x': 0, 'y': -1 },
    { 'x': -1, 'y': 0 },
    { 'x': 0, 'y': 1 },
    { 'x': 1, 'y': 0 },
];

export const ChatDirections: Record<string, DIRECTION | undefined> = {
    'up': DIRECTION.NORTH,
    'left': DIRECTION.WEST,
    'down': DIRECTION.SOUTH,
    'right': DIRECTION.EAST,
    'north': DIRECTION.NORTH,
    'west': DIRECTION.WEST,
    'south': DIRECTION.SOUTH,
    'east': DIRECTION.EAST,
};
