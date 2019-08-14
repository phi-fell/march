import uuid = require('uuid/v4');
import { Location } from './location';
import { Instance } from './instance';
import { Player } from './player';

function generateNewEntityID() {
    return uuid();
}
export class Entity {
    status: any;
    constructor(public id: string, public name: string, public location: Location = new Location(0, 0, '')) {
        this.status = {
            'hp': 10,
            'max_hp': 10,
            'sp': 10,
            'max_sp': 10,
            'ap': 0,
            'ap_recovery': 25,
            'max_ap': 60,
        }
    }
    protected handleDeath() {
        //TODO: add ability to attach listeners to entities e.g. death listener, damage listener, etc.
        //TODO: kill entity
        Instance.removeEntityFromWorld(this);
    }
    protected takeDirectHealthDamage(amount) {
        //take this damage directly to health and then account for effects (e.g. dying if health = 0 or whatever)
        //this functions is basically just health -= amount
        this.status.hp -= amount;
        if (this.status.hp <= 0) {
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
    move(to: Location) {
        var fromInst = Instance.instances[this.location.instance_id];
        var toInst = Instance.instances[to.instance_id];
        if (to.x >= 0 && to.x < toInst.board.length && to.y >= 0 && to.y < toInst.board[0].length) {
            if (toInst.board[to.x][to.y] === undefined) {
                fromInst.board[this.location.x][this.location.y] = undefined;
                toInst.board[to.x][to.y] = this;
                this.location = to.clone();
            } else {
                toInst.board[to.x][to.y]!.hit(1);
            }
            fromInst.updateAllPlayers();
            toInst.updateAllPlayers();
        }
    }
    static generateNewEntityID() {
        return uuid();
    }
}