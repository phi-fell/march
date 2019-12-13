import fs = require('fs');
import path = require('path');

import { Random } from '../math/random';
import { Armor } from './armor';
import { ArmorData } from './armordata';
import { Weapon } from './weapon';
import { WeaponData } from './weapondata';

export type ItemSchemaID = string;

export class Item {
    public static generateNewItemID() {
        return Random.uuid();
    }
    public static getItemFromSchemaID(schemaID: ItemSchemaID): Item | null {
        const schema = Item.itemSchemas[schemaID];
        if (schema) {
            return schema.clone();
        }
        console.log('Item schema does not exist: ' + schemaID);
        return null;
    }
    public static addSchema(id: ItemSchemaID, schema: Item) {
        Item.itemSchemas[id] = schema;
    }
    public static fromJSON(json: any) {
        return new Item(
            json.schema,
            json.name,
            json.stackable,
            (json.weapon_data) ? WeaponData.fromJSON(json.weapon_data) : (null),
            (json.armor_data) ? ArmorData.fromJSON(json.armor_data) : (null),
        );
    }
    private static itemSchemas: { [id: string]: Item; } = {};
    private _id: string;
    private constructor(
        public schema: ItemSchemaID,
        public name: string,
        public stackable: boolean,
        public weapon_data: WeaponData | null,
        public armor_data: ArmorData | null,
    ) {
        this._id = Item.generateNewItemID();
    }
    public get asWeapon(): Weapon | null {
        return (this.weapon_data === null) ? (null) : (this as Weapon);
    }
    public get asArmor(): Armor | null {
        return (this.armor_data === null) ? (null) : (this as Armor);
    }
    public get id(): string {
        return this._id;
    }
    public equals(other: Item | null) {
        return other && this._id === other._id;
    }
    public toJSON() {
        return {
            'id': this._id,
            'schema': this.schema,
            'name': this.name,
            'stackable': this.stackable,
            'weapon_data': (this.weapon_data) ? this.weapon_data.toJSON() : (null),
            'armor_data': (this.armor_data) ? this.armor_data.toJSON() : (null),
        };
    }
    public clone(): Item {
        return new Item(
            this.schema,
            this.name,
            this.stackable,
            (this.weapon_data) ? this.weapon_data.clone() : (null),
            (this.armor_data) ? this.armor_data.clone() : (null),
        );
    }
}

function addItem(dir: string, filename: string) {
    fs.readFile(dir + '/' + filename, 'utf-8', (err, content) => {
        if (err) {
            return console.log(err);
        }
        const schema_id = filename.split('.')[0];
        const schema = JSON.parse(content);
        schema.schema = schema_id;
        Item.addSchema(schema_id, Item.fromJSON(schema));
    });
}
function addItemDirectory(root: string, subdirectory: string | null = null) {
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
