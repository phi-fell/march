import * as t from 'io-ts';
import { CharacterSheet } from '../character/charactersheet';
import { Inventory } from '../item/inventory';
import { ArmorData, ItemData, WeaponData } from '../item/itemdata';
import { Random, UUID } from '../math/random';
import type { Cell } from './cell';
import { Controller } from './controller';
import { DIRECTION } from './direction';
import { Locatable, locatable_schema } from './locatable';
import { Location } from './location';
import { VisibilityManager } from './visibilitymanager';

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
            'visibility_manager': t.any,
        }),
    ]);

    /**
     * Only call if the resulting entity will be placed into a cell/board by the caller
     * e.g. call this from Board.fromJSON() and probably nowhere else
     */
    public static fromJSON(cell: Cell, json: EntitySchema): Entity {
        const ret = new Entity(Location.fromJSON(cell, json.location), json.id);
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
        if (json.visibility_manager) {
            ret.visibility_manager = VisibilityManager.fromJSON(json.visibility_manager);
        }
        return ret;
    }

    public direction: DIRECTION = DIRECTION.UP;
    public sheet?: CharacterSheet;
    public controller?: Controller;
    public inventory?: Inventory;
    public item_data?: ItemData;
    public visibility_manager?: VisibilityManager;
    public constructor(loc: Location, public id: UUID = Random.uuid()) {
        super(loc);
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
    public getName(): string {
        if (this.sheet) {
            return this.sheet.name;
        }
        if (this.item_data) {
            return this.item_data.name;
        }
        return this.id;
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
        if (this.visibility_manager) {
            ret.visibility_manager = this.visibility_manager.toJSON();
        }
        return ret;
    }
    public getClientJSON() {
        return this.toJSON(); // TODO: reduce info sent
    }
}
