import { CharacterSheet } from '../character/charactersheet';
import { Inventory } from '../item/inventory';
import { ArmorData, ItemData, WeaponData } from '../item/itemdata';
import { Controller } from './controller';
import { Location } from './location';

export interface Locatable extends Entity {
    location: Location;
}

export interface Mob extends Locatable {
    location: Location;
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

export class Entity {
    public location?: Location;
    public sheet?: CharacterSheet;
    public controller?: Controller;
    public inventory?: Inventory;
    public item_data?: ItemData;
    public isLocatable(): this is Locatable {
        return this.location !== undefined;
    }
    public isMob(): this is Mob {
        return (this.location !== undefined
            && this.controller !== undefined
            && this.sheet !== undefined
            && this.inventory !== undefined
        );
    }
}
