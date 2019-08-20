import uuid = require('uuid/v4');
import { Instance } from './instance';
import { Location } from './location';
import { CharacterSheet } from './charactersheet';

export enum SPRITE {
    NAME = -1,
    NONE = 0,
    PLAYER,
    SLIME,

}

export class Entity {
    public status: any;
    private lastHitSheet: CharacterSheet | undefined;
    constructor(public id: string, public name: string, public sprite: SPRITE = SPRITE.NONE, protected _location: Location = new Location(0, 0, '')) {
        this.status = {
            'hp': 10,
            'max_hp': 10,
            'sp': 10,
            'max_sp': 10,
            'ap': 0,
            'max_ap': 60,
            'ap_recovery': 25,
        };
        this.lastHitSheet = undefined;
    }
    get location(): Location {
        return this._location;
    }
    set location(loc: Location) {
        if (this.location.instance_id !== loc.instance_id) {
            const fromInst = Instance.instances[this.location.instance_id];
            if (fromInst) {
                Instance.instances[this.location.instance_id].removeMob(this);
            }
            Instance.instances[loc.instance_id].addMob(this);
        }
        this._location = loc;
    }
    public hit(amount: number, charsheet?: CharacterSheet) {
        if (charsheet) {
            this.lastHitSheet = charsheet;
        }
        // take a hit, first applying chance to dodge, etc.
        var dodgeChance = 0;
        if (Math.random() >= dodgeChance) {
            this.takeDamage(amount);
        }
    }
    public move(to: Location) {
        const fromInst = Instance.instances[this.location.instance_id];
        const toInst = Instance.instances[to.instance_id];
        if (toInst.isTilePassable(to.x, to.y)) {
            const mobInWay = toInst.getMobInLocation(to.x, to.y);
            if (mobInWay) {
                mobInWay.hit(1); // TODO: give all mobs a charsheet??? or a placeholder for EXP calculations?
            } else {
                this.location = to.clone();
            }
            if (fromInst.id !== toInst.id) {
                fromInst.updateAllPlayers();
            }
            toInst.updateAllPlayers();
        }
    }
    protected handleDeath() {
        // TODO: add ability to attach listeners to entities e.g. death listener, damage listener, etc.
        // TODO: kill entity
        Instance.removeEntityFromWorld(this);
        if (this.lastHitSheet) {
            this.lastHitSheet.addExperience(1); // TODO: make amount variable
        }
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