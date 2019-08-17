import uuid = require('uuid/v4');
import { Instance } from './instance';
import { Location } from './location';
import { Player } from './player';

export class Entity {
    public status: any;
    constructor(public id: string, public name: string, protected _location: Location = new Location(0, 0, '')) {
        this.status = {
            'hp': 10,
            'max_hp': 10,
            'sp': 10,
            'max_sp': 10,
            'ap': 0,
            'max_ap': 60,
            'ap_recovery': 25,
        };
    }
    get location(): Location {
        return this._location;
    }
    set location(loc: Location) {
        this._location = loc;
    }
    public hit(amount: number) {
        // take a hit, first applying chance to dodge, etc.
        var dodgeChance = 0;
        if (Math.random() >= dodgeChance) {
            this.takeDamage(amount);
        }
    }
    public move(to: Location) {
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
    protected handleDeath() {
        // TODO: add ability to attach listeners to entities e.g. death listener, damage listener, etc.
        // TODO: kill entity
        Instance.removeEntityFromWorld(this);
    }
    protected takeDirectHealthDamage(amount) {
        // take this damage directly to health and then account for effects (e.g. dying if health = 0 or whatever)
        // this functions is basically just health -= amount
        this.status.hp -= amount;
        if (this.status.hp <= 0) {
            this.handleDeath();
        }
    }
    protected takeNetDamage(amount) {
        // apply this damage without accounting for armor, resistances, etc.
        // this function handles e.g. applying the damage first to a magical energy shield before actual health, or whatnot
        let shield = 0;// for example purposes. (should probably add a 'takeDirectShieldDamage' function if this were a feature)
        if (amount <= shield) {
            shield -= amount;
        } else {
            const netAmount = amount - shield;
            shield = 0;
            this.takeDirectHealthDamage(netAmount);
        }
    }
    protected takeDamage(amount) {
        // take amount damage, filtered through armor, resists, etc.
        const armor = 0;// for example purposes
        this.takeNetDamage(amount - armor);
    }
    static generateNewEntityID() {
        return uuid();
    }
}