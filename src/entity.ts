import uuid = require('uuid/v4');
import { Location } from './location';
import { Instance } from './instance';
import { Player } from './player';

function generateNewEntityID() {
    return uuid();
}
export class Entity {
    health: number;
    constructor(public id: string, public name: string, public location: Location = new Location(0, 0, '')) {
        this.health = 2;
    }
    protected handleDeath() {
        //TODO: add ability to attach listeners to entities e.g. death listener, damage listener, etc.
        //TODO: kill entity
        Instance.removeEntityFromWorld(this);
        if (this instanceof Player) {
            (this as Player).user!.socket.emit('force_disconnect', 'YOU HAVE DIED');
            (this as Player).user!.logout();
            (this as Player).user!.unload();
        }
    }
    protected takeDirectHealthDamage(amount) {
        //take this damage directly to health and then account for effects (e.g. dying if health = 0 or whatever)
        //this functions is basically just health -= amount
        this.health -= amount;
        if (this.health <= 0) {
            this.handleDeath();
        }
    }
    protected takeNetDamage(amount) {
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
    protected takeDamage(amount) {
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
    static generateNewEntityID() {
        return uuid();
    }
}