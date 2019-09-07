import uuid = require('uuid/v4');
import { Instance } from './instance';
import { Location } from './location';
import { CharacterSheet } from './character/charactersheet';

export const MOVE_AP = 6;

export enum SPRITE {
    NAME = -1,
    NONE = 0,
    PLAYER,
    SLIME,

}

export enum ACTION_STATUS {
    PERFORMED,
    WAITING,
    ASYNC,
}

export class Entity {
    public status: any;
    private lastHitSheet: CharacterSheet | undefined;
    protected _location: Location;
    constructor(public id: string, public name: string, public sprite: SPRITE = SPRITE.NONE, loc = new Location(0, 0, '')) {
        this._location = new Location(0, 0, '');
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
        this.location = loc;
    }
    get location(): Location {
        return this._location;
    }
    set location(loc: Location) {
        if (this.location.instance_id !== loc.instance_id) {
            const fromInst = Instance.instances[this.location.instance_id];
            const toInst = Instance.instances[loc.instance_id];
            if (fromInst) {
                fromInst.removeMob(this);
            }
            if (toInst) {
                toInst.addMob(this);
            }
        }
        this._location = loc;
    }
    public doNextAction(): ACTION_STATUS {
        if (this.status.ap >= MOVE_AP) {
            let dirs = [
                { 'x': 0, 'y': -1 },
                { 'x': 0, 'y': 1 },
                { 'x': -1, 'y': 0 },
                { 'x': 1, 'y': 0 },
            ];
            let dir = dirs[Math.floor(Math.random() * 4)];
            let newLoc = this.location.getMovedBy(dir.x, dir.y);
            this.move(newLoc); // TODO: ensure move succeeded
            this.status.ap -= MOVE_AP;
            return ACTION_STATUS.PERFORMED;
        } else {
            return ACTION_STATUS.WAITING;
        }
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
    protected move(to: Location) {
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
                // TODO: instead of sending whole board, send action info so that we can update exactly when necessary
                toInst.updateAllPlayers(); // TODO: is this necessary?  reasoning: players in fromInst WILL be updated at end of update cycle,  toInst could hypothetically not be updated until next update cycle.  (but update cycles should be multiple time per second, so is this necessary?)
            }
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