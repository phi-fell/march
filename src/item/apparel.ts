import { ITEM_TYPE, ItemSchema, Item, ItemSchemaID } from './item';

export enum APPAREL_TYPE {
    // jewelry
    NECKLACE,
    BRACELET,
    ARM_BAND,
    EARRING,
    RING,
    // clothing
    HAT,
    SHIRT,
    VEST,
    BELT,
    PANTS,
    LEFT_GLOVE,
    RIGHT_GLOVE,
    // armor
    HELMET,
    CUIRASS,
    LEFT_PAULDRON,
    RIGHT_PAULDRON,
    LEFT_BRACER,
    RIGHT_BRACER,
    GREAVES,
    LEG,
    FEET,
}

export interface ApparelSchema extends ItemSchema {
    item_type: ITEM_TYPE.APPAREL;
    coverage: number;
    resilience: number;
    armor: number;
}

export class Apparel extends Item {
    protected _schema: ApparelSchema;
    constructor(schemaID: ItemSchemaID) {
        super(schemaID);
        this._schema = Item.itemSchemas[schemaID] as ApparelSchema;
        if (this._schema.item_type !== ITEM_TYPE.APPAREL) {
            console.log('Non-Apparel Item loaded as Apparel!');
        }
    }
    get coverage(): number {
        return this._schema.coverage;
    }
    get resilience(): number {
        return this._schema.resilience;
    }
    get armor(): number {
        return this._schema.armor;
    }
    public toJSON() {
        return {
            'name': this.name,
            'coverage': this.coverage,
            'resilience': this.resilience,
            'armor': this.armor,
        };
    }
}