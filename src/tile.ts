import fs = require('fs');

const tileNames: string[] = [];
const tilesByName: { [name: string]: Tile; } = {};
const tileProps: Array<TileProperties> = [];

fs.readdir('res/tile', (err, filenames) => {
    if (err) {
        return console.log(err);
    }
    filenames.forEach((filename) => {
        fs.readFile('res/tile/' + filename, 'utf-8', function (err, content) {
            if (err) {
                return console.log(err);
            }
            const name = filename.split('.')[0];
            tilesByName[name] = tileNames.length;
            tileNames.push(name);
            tileProps.push(JSON.parse(content) as TileProperties);
        });
    });
});

export type Tile = number;

export const NO_TILE = -1 as Tile;
export const ERROR_TILE = -2 as Tile;

export interface TileProperties {
    passable: boolean;
    obstruction: boolean;
}

export function getTilePalette(): string[] {
    return tileNames;
}

export function getTileFromName(name: string): Tile {
    if (tilesByName.hasOwnProperty(name)) {
        return tilesByName[name];
    } else {
        return ERROR_TILE;
    }
}

export function getTileName(tile: Tile): string {
    return tileNames[tile];
}

export function getTileProps(tile: Tile): TileProperties {
    return tileProps[tile];
}