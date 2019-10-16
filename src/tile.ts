import fs = require('fs');

const tileNames: string[] = [];
const tilesByName: { [name: string]: Tile; } = {};
const tileProps: TileProperties[] = [];

fs.readdir('res/tile', (dir_err, filenames) => {
    if (dir_err) {
        return console.log(dir_err);
    }
    filenames.forEach((filename) => {
        fs.readFile('res/tile/' + filename, 'utf-8', (err, content) => {
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
    }
    return ERROR_TILE;
}

export function getTileName(tile: Tile): string {
    return tileNames[tile];
}

export function getTileProps(tile: Tile): TileProperties {
    return tileProps[tile];
}
