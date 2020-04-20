export enum DIRECTION {
    UP,
    LEFT,
    DOWN,
    RIGHT,
}

export const directionVectors = [
    { 'x': 0, 'y': -1 },
    { 'x': -1, 'y': 0 },
    { 'x': 0, 'y': 1 },
    { 'x': 1, 'y': 0 },
];

export const ChatDirections: Record<string, DIRECTION | undefined> = {
    'up': DIRECTION.UP,
    'left': DIRECTION.LEFT,
    'down': DIRECTION.DOWN,
    'right': DIRECTION.RIGHT,
    'north': DIRECTION.UP,
    'west': DIRECTION.LEFT,
    'south': DIRECTION.DOWN,
    'east': DIRECTION.RIGHT,
};
