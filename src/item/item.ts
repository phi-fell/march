import fs = require('fs');
import path = require('path');

export enum ITEM_TYPE {
    APPAREL,
    WEAPON,
    MISC,
}

export interface ItemSchema {
    name: string;
    item_type: ITEM_TYPE;
    stackable: boolean;
}

export type ItemSchemaID = string;

const itemSchemas: { [id: string]: ItemSchema; } = {};

export class Item {
    constructor(private schemaID) {
    }
    get item_type() {
        return itemSchemas[this.schemaID].item_type;
    }
    get name() {
        return itemSchemas[this.schemaID].name;
    }
    public toJSON() {
        return {
            'schemaID': this.schemaID,
            'name': this.name,
        };
    }
}

function addItem(dir, filename) {
    fs.readFile(dir + '/' + filename, 'utf-8', (err, content) => {
        if (err) {
            return console.log(err);
        }
        const id = filename.split('.')[0];
        const schema = JSON.parse(content);
        itemSchemas[id] = schema;
    });
}
function addItemDirectory(directory) {
    fs.readdir(directory, (dir_err, filenames) => {
        if (dir_err) { 
            return console.log(dir_err);
        }
        filenames.forEach((filename) => {
            const file = path.resolve(directory, filename);
            fs.stat(file, (stat_err, stat) => {
                if (stat && stat.isDirectory()) {
                    addItemDirectory(directory + '/' + filename);
                } else {
                    addItem(directory, filename);
                }
            });
        });
    });
}

addItemDirectory('res/item');
