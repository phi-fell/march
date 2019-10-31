import fs = require('fs');
import path = require('path');

import { ITEM_TYPE } from './itemtype';

export type ItemSchemaID = string;

export interface ItemSchema {
    id: ItemSchemaID;
    name: string;
    item_type: ITEM_TYPE;
    stackable: boolean;
}

export class Item {
    public static getItemType(schemaID: ItemSchemaID): ITEM_TYPE | null {
        const schema = Item.itemSchemas[schemaID];
        if (!schema) {
            return null;
        }
        return schema.item_type;
    }
    public static addSchema(id: ItemSchemaID, schema: ItemSchema) {
        Item.itemSchemas[id] = schema;
    }
    protected static itemSchemas: { [id: string]: ItemSchema; } = {};
    protected _schema: ItemSchema;
    constructor(schemaID: ItemSchemaID) {
        this._schema = Item.itemSchemas[schemaID];
        if (!this._schema) {
            console.log('Item schema does not exist: ' + schemaID);
        }
    }
    get schema(): ItemSchemaID {
        return this._schema.id;
    }
    get item_type(): ITEM_TYPE {
        return this._schema.item_type;
    }
    get name(): string {
        return this._schema.name;
    }
    get stackable(): boolean {
        return this._schema.stackable;
    }
    public toJSON() {
        return {
            'name': this.name,
            'type': ITEM_TYPE[this.item_type],
            'stackable': this.stackable,
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
        schema.item_type = ITEM_TYPE[schema.item_type];
        schema.id = id;
        Item.addSchema(id, schema);
    });
}
function addItemDirectory(root, subdirectory: string | null = null) {
    const directory = root + (subdirectory ? ('/' + subdirectory) : '');
    fs.readdir(directory, (dir_err, filenames) => {
        if (dir_err) {
            return console.log(dir_err);
        }
        filenames.forEach((filename) => {
            const file = path.resolve(directory, filename);
            fs.stat(file, (stat_err, stat) => {
                if (stat && stat.isDirectory()) {
                    addItemDirectory(root, (subdirectory ? (subdirectory + '/') : '') + filename);
                } else {
                    addItem(root, (subdirectory ? (subdirectory + '/') : '') + filename);
                }
            });
        });
    });
}

addItemDirectory('res/item');
