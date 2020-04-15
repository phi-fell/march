import { CharacterSheet } from '../character/charactersheet';
import { Inventory } from '../item/inventory';
import { ArmorData, ItemData, WeaponData } from '../item/itemdata';
import { Controller } from './controller';
import { Locatable, locatable_schema } from './locatable';
import { Location } from './location';
import * as t from 'io-ts';
import type { World } from './world';
import { UUID, Random } from '../math/random';
import { DIRECTION } from './direction';

export interface Mob extends Entity {
    controller: Controller;
    sheet: CharacterSheet;
    inventory: Inventory;
}

export interface Item extends Entity {
    item_data: ItemData;
}
export interface Weapon extends Item {
    item_data: WeaponData;
}
export interface Armor extends Item {
    item_data: ArmorData;
}

export type EntitySchema = t.TypeOf<typeof Entity.schema>;

export class Entity extends Locatable {
    public static schema = t.intersection([
        t.type({
            'id': t.string,
            'direction': t.keyof(DIRECTION),
        }),
        locatable_schema,
        t.partial({
            'sheet': CharacterSheet.schema,
            'controller': Controller.schema,
            'inventory': Inventory.schema,
            'item_data': ItemData.schema,
        }),
    ]);

    public static async fromJSON(world: World, json: EntitySchema): Promise<Entity> {
        const ret = new Entity(world, Location.fromJSON(json.location), json.id);
        ret.direction = DIRECTION[json.direction];
        if (json.sheet) {
            ret.sheet = CharacterSheet.fromJSON(json.sheet);
        }
        if (json.controller) {
            ret.controller = Controller.fromJSON(json.controller);
        }
        if (json.inventory) {
            ret.inventory = Inventory.fromJSON(json.inventory);
        }
        if (json.item_data) {
            ret.item_data = ItemData.fromJSON(json.item_data);
        }
        await ret.ready();
        return ret;
    }

    public direction: DIRECTION = DIRECTION.UP;
    public sheet?: CharacterSheet;
    public controller?: Controller;
    public inventory?: Inventory;
    public item_data?: ItemData;
    private constructor(world: World, loc: Location, public id: UUID = Random.uuid()) {
        super(world, loc);
    }
    public isEntity(): this is Entity {
        return true;
    }
    public isMob(): this is Mob {
        return (
            this.controller !== undefined &&
            this.sheet !== undefined &&
            this.inventory !== undefined
        );
    }
    public equals(other: Entity): boolean {
        return this.id === other.id;
    }
    public toJSON(): EntitySchema {
        const ret: EntitySchema = {
            'id': this.id,
            'direction': DIRECTION[this.direction] as keyof typeof DIRECTION,
            'location': this.location.toJSON(),
        }
        if (this.sheet) {
            ret.sheet = this.sheet.toJSON();
        }
        if (this.controller) {
            ret.controller = this.controller.toJSON();
        }
        if (this.inventory) {
            ret.inventory = this.inventory.toJSON();
        }
        if (this.item_data) {
            ret.item_data = this.item_data.toJSON();
        }
        return ret;
    }
}
