import { Item, ITEM_TYPE, ItemSchema, ItemSchemaID } from './item';

export interface WeaponSchema extends ItemSchema {
    item_type: ITEM_TYPE.WEAPON;
    one_handed: boolean;
    piercing: number;
    sharpness: number;
    force: number;
    precision: number;
    speed: number;
}

export class Weapon extends Item {
    protected _schema: WeaponSchema;
    constructor(schemaID: ItemSchemaID) {
        super(schemaID);
        this._schema = Item.itemSchemas[schemaID] as WeaponSchema;
        if (this._schema.item_type !== ITEM_TYPE.WEAPON) {
            console.log('Non-Weapon Item loaded as Weapon!');
        }
    }
    get one_handed(): boolean {
        return this._schema.one_handed;
    }
    get piercing(): number {
        return this._schema.piercing;
    }
    get sharpness(): number {
        return this._schema.sharpness;
    }
    get force(): number {
        return this._schema.force;
    }
    get precision(): number {
        return this._schema.precision;
    }
    get speed(): number {
        return this._schema.speed;
    }
    public toJSON() {
        return {
            'name': this.name,
            'one_handed': this.one_handed,
            'piercing': this.piercing,
            'sharpness': this.sharpness,
            'force': this.force,
            'precision': this.precision,
            'speed': this.speed,
        };
    }
}