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
    'n': DIRECTION.NORTH,
    'w': DIRECTION.WEST,
    's': DIRECTION.SOUTH,
    'e': DIRECTION.EAST,
};

export function getRelativeDirection(from: DIRECTION, to: DIRECTION): RELATIVE_DIRECTION {
    return ((to - from) + 4) % 4;
}
