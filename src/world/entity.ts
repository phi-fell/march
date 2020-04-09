import type { CharacterSheet } from '../character/charactersheet';
import type { Inventory } from '../item/inventory';
import type { ArmorData, ItemData, WeaponData } from '../item/itemdata';
import type { Controller } from './controller';
import { Locatable } from './locatable';
import type { Location } from './location';

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

export class Entity extends Locatable {
    public sheet?: CharacterSheet;
    public controller?: Controller;
    public inventory?: Inventory;
    public item_data?: ItemData;
    constructor(loc: Location) {
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
}
