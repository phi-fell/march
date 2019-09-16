import { Item } from '../item/item';

export class CharacterEquipment {
    public static fromJSON(json) {
        return new CharacterEquipment();
    }
    public weapon: Item;
    constructor() {
        this.weapon = new Item('weapon/sword');
    }
    public toJSON() {
        return {
        };
    }
}