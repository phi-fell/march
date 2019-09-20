import { Weapon } from '../item/weapon';
import { ATTRIBUTE, CharacterAttributes } from './characterattributes';
import { CharacterEquipment } from './characterequipment';
import { CharacterFaith } from './characterfaith';
import { CharacterRace } from './characterrace';
import { RESOURCE } from './characterresource';
import { CharacterStatus } from './characterstatus';

export class CharacterSheet {
    public static fromJSON(json: any) {
        const ret = new CharacterSheet();
        // TODO: load faiths
        ret._race = CharacterRace.fromJSON(json.race);
        ret._allocatedAttributes = CharacterAttributes.fromJSON(json.allocatedAttributes);
        ret._experience = json.exp;
        ret.recalculateDerivedStats();
        return ret;
    }
    private _allocatedAttributes: CharacterAttributes = new CharacterAttributes();
    private _race: CharacterRace;
    private _faiths: CharacterFaith[];
    private _equipment: CharacterEquipment;
    private _status: CharacterStatus;
    private _experience: number;
    // cache
    private _cachedAttributes: CharacterAttributes = new CharacterAttributes();
    private _hasPool: boolean[] = [];
    constructor() {
        this._race = new CharacterRace();
        this._faiths = [];
        this._equipment = new CharacterEquipment();
        this._status = new CharacterStatus();
        this._experience = 0;
        this.recalculateDerivedStats();
    }
    get race() {
        return this._race;
    }
    set race(or: CharacterRace) {
        this._race = or;
        this.recalculateDerivedStats();
    }
    get status() {
        return this._status;
    }
    public hasSufficientAP(ap: number): boolean {
        return this._status.action_points >= ap;
    }
    public useAP(ap: number) {
        this._status.action_points -= ap;
    }
    public hasResource(resource: RESOURCE) {
        return this._hasPool[resource];
    }
    public addExperience(amount: number) {
        this._experience += amount;
        this.recalculateDerivedStats();
    }
    public getNetAttributeValue(attr: ATTRIBUTE): number {
        return this._cachedAttributes.get(attr);
    }
    public levelUpAttribute(attr: ATTRIBUTE) {
        const costs = this._allocatedAttributes.getLevelupCosts();
        if (this._experience >= costs.get(attr)) {
            this._experience -= costs.get(attr);
            this._allocatedAttributes.set(attr, this._allocatedAttributes.get(attr) + 1);
        }
        this.recalculateDerivedStats();
    }
    public startNewTurn() {
        this._status.startNewTurn();
    }
    public takeHit(attacker: CharacterSheet, weapon: Weapon | null) {
        // take a hit, first applying chance to dodge, etc.
        const dodgeChance = 0;
        // TODO: multiple classes of hit: critical, direct, glancing, miss
        // e.g. critical could be a hit to head or vital region: +damage (maybe double dmg?)
        // e.g. direct is normal
        // e.g. glancing is almost dodge but not quite. (half? damage)
        if (Math.random() >= dodgeChance) {
            let armor = 0; // TODO: calculate total armor
            let blunt = this.getNetAttributeValue(ATTRIBUTE.STRENGTH) + (weapon ? (weapon.force) : 0); // [str]D[force] ?
            if (blunt > armor) {
                blunt -= armor;
                armor = 0;
                this.takeBluntDamage(blunt);
            } else {
                armor -= blunt;
                blunt = 0;
            }
            const resilience = 0; // TODO: calculate resilience from natural armor, or equipment
            const piercing = weapon ? (weapon.piercing) : 0;
            if (piercing > resilience) {
                const sharp = (piercing - resilience) * (weapon ? (weapon.sharpness) : 0); // [pierce-res]D[sharp] ?
                if (sharp > armor) {
                    this.takeSharpDamage(sharp - armor);
                }
            }
        }
    }
    public isDead(): boolean {
        if (this.hasResource(RESOURCE.SOUL) && this._status.pools[RESOURCE.SOUL].quantity <= 0) {
            return true;
        }
        if (this.hasResource(RESOURCE.BLOOD)) {
            return this._status.pools[RESOURCE.BLOOD].quantity <= 0;
        }
        if (this.hasResource(RESOURCE.FLESH)) {
            return this._status.pools[RESOURCE.FLESH].quantity <= 0;
        }
        if (this.hasResource(RESOURCE.BONE)) {
            return this._status.pools[RESOURCE.BONE].quantity <= 0;
        }
        return false; // TODO: more conditions? modify conditions?
    }
    public toJSON() {
        return {
            'attributes': this._cachedAttributes.toJSON(),
            'allocatedAttributes': this._allocatedAttributes.toJSON(),
            'attributeLevelupCosts': this._allocatedAttributes.getLevelupCosts().toJSON(),
            'faiths': [],
            'race': this._race.toJSON(),
            'equipment': this._equipment.toJSON(),
            'status': this._status.toJSON(),
            'exp': this._experience,
        };
    }
    protected takeBluntDamage(amount: number) {
        if (this.hasResource(RESOURCE.FLESH) && this._status.pools[RESOURCE.FLESH].quantity > 0) {
            if (this._status.pools[RESOURCE.FLESH].quantity > amount) {
                this._status.pools[RESOURCE.FLESH].quantity -= amount;
                return;
            }
            amount -= this._status.pools[RESOURCE.FLESH].quantity;
            this._status.pools[RESOURCE.FLESH].quantity = 0;
        }
        if (this.hasResource(RESOURCE.BONE) && this._status.pools[RESOURCE.BONE].quantity > 0) {
            if (this._status.pools[RESOURCE.BONE].quantity > amount) {
                this._status.pools[RESOURCE.BONE].quantity -= amount;
                return;
            }
            amount -= this._status.pools[RESOURCE.FLESH].quantity;
            this._status.pools[RESOURCE.FLESH].quantity = 0;
        }
        if (this.hasResource(RESOURCE.FLESH)) {
            this._status.pools[RESOURCE.FLESH].quantity -= amount;
            amount = 0;
            return;
        }
    }
    protected takeSharpDamage(amount) {
        if (this.hasResource(RESOURCE.FLESH)) {
            this._status.pools[RESOURCE.FLESH].quantity -= amount;
            amount = 0;
            return;
        }
        if (this.hasResource(RESOURCE.BONE)) {
            this._status.pools[RESOURCE.BONE].quantity -= amount;
            amount = 0;
            return;
        }
    }
    private recalculateDerivedStats() {
        for (const type in RESOURCE) {
            if (isNaN(Number(type))) {
                this._hasPool[RESOURCE[type]] = true;
            }
        }
        this._cachedAttributes = this._race.getNetAttributes().getSumWith(this._allocatedAttributes);
        // TODO: apply effects that modify attributes
        this._status.pools[RESOURCE.FLESH].capacity = this.getNetAttributeValue(ATTRIBUTE.VITALITY);
        this._status.pools[RESOURCE.BLOOD].capacity = this.getNetAttributeValue(ATTRIBUTE.VITALITY) + this.getNetAttributeValue(ATTRIBUTE.ENDURANCE);
        this._status.pools[RESOURCE.BONE].capacity = this.getNetAttributeValue(ATTRIBUTE.VITALITY) + this.getNetAttributeValue(ATTRIBUTE.STRENGTH);
        this._status.pools[RESOURCE.SOUL].capacity = this.getNetAttributeValue(ATTRIBUTE.WISDOM) + this.getNetAttributeValue(ATTRIBUTE.CHARISMA);
        this._status.pools[RESOURCE.STAMINA].capacity = this.getNetAttributeValue(ATTRIBUTE.ENDURANCE);
        this._status.pools[RESOURCE.MANA].capacity = this.getNetAttributeValue(ATTRIBUTE.WISDOM);
    }
}
