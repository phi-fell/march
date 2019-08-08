import uuid = require('uuid/v4');
import { Location } from './location';

function generateNewEntityID() {
    return uuid();
}
export class Entity {
    health: number;
    constructor(public id: string, public name: string, public location: Location) {
        this.health = 10;
    }
    private handleDeath() {
        //TODO: kill entity
    }
    private takeDirectHealthDamage(amount) {
        //take this damage directly to health and then account for effects (e.g. dying if health = 0 or whatever)
        //this functions is basically just health -= amount
        this.health -= amount;
        if (this.health <= 0) {
            this.handleDeath();
        }
    }
    private takeNetDamage(amount) {
        //apply this damage without accounting for armor, resistances, etc.
        //this function handles e.g. applying the damage first to a magical energy shield before actual health, or whatnot
        var shield = 0;//for example purposes. (should probably add a 'takeDirectShieldDamage' function if this were a feature)
        if (amount <= shield) {
            shield -= amount;
        } else {
            let netAmount = amount - shield;
            shield = 0;
            this.takeDirectHealthDamage(netAmount);
        }
    }
    private takeDamage(amount) {
        //take amount damage, filtered through armor, resists, etc.
        var armor = 0;//for example purposes
        this.takeNetDamage(amount - armor);
    }
    hit(amount) {
        //take a hit, first applying chance to dodge, etc.
        var dodgeChance = 0;
        if (Math.random() >= dodgeChance) {
            this.takeDamage(amount);
        }
    }
}