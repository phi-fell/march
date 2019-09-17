import { Weapon } from '../item/weapon';

export class CharacterEquipment {
    public static fromJSON(json) {
        return new CharacterEquipment();
    }
    public weapon: Weapon;
    constructor() {
        this.weapon = new Weapon('weapon/sword');
    }
    public toJSON() {
        return {
            'weapon': this.weapon.toJSON(),
        };
    }
}