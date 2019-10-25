import { Weapon } from '../item/weapon';
import { Random } from '../math/random';
import { ATTRIBUTE, CharacterAttributes } from './characterattributes';
import { CharacterEquipment } from './characterequipment';
import { CharacterFaith } from './characterfaith';
import { CharacterRace } from './characterrace';
import { RESOURCE } from './characterresource';
import { CharacterSkills } from './characterskills';
import { CharacterStatus } from './characterstatus';

export const STARTING_ESSENCE = 100;

export class CharacterSheet {
    public static validateAndCreateFromJSON(json: any) {
        const ret = new CharacterSheet();
        if (!CharacterRace.raceExists(json.race)) {
            return null;
        }
        ret._race = new CharacterRace(json.race);
        ret._allocatedAttributes = CharacterAttributes.fromJSON(json.attributes);
        ret._skills = CharacterSkills.fromJSON(json.skills);
        ret._essence = STARTING_ESSENCE - (ret._race.getEssenceCost() + ret._allocatedAttributes.getEssenceCost() + ret._skills.getEssenceCost());
        if (ret._essence < 0) {
            return null;
        }
        ret.recalculateDerivedStats();
        ret._status.restoreFully();
        return ret;
    }
    public static fromMobSchemaJSON(json: any) {
        const ret = new CharacterSheet();
        ret._race = new CharacterRace(json.race);
        ret._allocatedAttributes = CharacterAttributes.fromJSON(json.attributes);
        ret._skills = CharacterSkills.fromJSON(json.skills);
        ret.recalculateDerivedStats();
        ret._status.restoreFully();
        return ret;
    }
    public static fromJSON(json: any) {
        const ret = new CharacterSheet();
        // TODO: load faiths
        ret._race = CharacterRace.fromJSON(json.race);
        ret._allocatedAttributes = CharacterAttributes.fromJSON(json.allocatedAttributes);
        ret._skills = CharacterSkills.fromJSON(json.skills);
        ret._status = CharacterStatus.fromJSON(json.status);
        ret._essence = json.exp;
        ret.recalculateDerivedStats();
        return ret;
    }
    private _allocatedAttributes: CharacterAttributes = new CharacterAttributes();
    private _skills: CharacterSkills = new CharacterSkills();
    private _race: CharacterRace;
    private _faiths: CharacterFaith[];
    private _equipment: CharacterEquipment;
    private _status: CharacterStatus;
    private _essence: number;
    // cache
    private _cachedAttributes: CharacterAttributes = new CharacterAttributes();
    private _hasPool: boolean[] = [];
    constructor() {
        this._race = new CharacterRace();
        this._faiths = [];
        this._equipment = new CharacterEquipment();
        this._status = new CharacterStatus();
        this._essence = 0;
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
        this._essence += amount;
    }
    public getNetAttributeValue(attr: ATTRIBUTE): number {
        return this._cachedAttributes.get(attr);
    }
    public getInitiative() {
        return this.status.action_points + this.getNetAttributeValue(ATTRIBUTE.PERCEPTION);
    }
    public levelUpAttribute(attr: ATTRIBUTE) {
        const costs = this._allocatedAttributes.getLevelupCosts();
        if (this._essence >= costs.get(attr)) {
            this._essence -= costs.get(attr);
            this._allocatedAttributes.set(attr, this._allocatedAttributes.get(attr) + 1);
        }
        this.recalculateDerivedStats();
    }
    public startNewTurn() {
        this._status.startNewTurn();
    }
    public startRest() {
        this._status.startRest();
    }
    public endRest() {
        this._status.endRest();
    }
    public takeHit(attacker: CharacterSheet, weapon: Weapon | null) {
        // TODO: combat calculations (not complete)
        /*
            chance to dodge: along the lines of hit_success=(1D20 + attacker.DEX) >= (1D20 + defender.AGI) or something
            if dodged do nothing (return);
            if hit, do armor coverage
            roll (attacker dex + weapon [precision) against (defender agi + total armor coverage)
            if attacker wins, do damage as if defendor has no armor
            else: see below code
        */
        // take a hit, first applying chance to dodge, etc.
        const dodgeChance = 0;
        // TODO: multiple classes of hit: critical, direct, glancing, miss
        // e.g. critical could be a hit to head or vital region: +damage (maybe double dmg?)
        // e.g. direct is normal
        // e.g. glancing is almost dodge but not quite. (half? damage)
        if (Random.float() >= dodgeChance) {
            let armor = 0; // TODO: calculate total armor
            let blunt = attacker.getNetAttributeValue(ATTRIBUTE.STRENGTH) + (weapon ? (weapon.force) : 0); // [str]D[force] ?
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
        if (this.hasResource(RESOURCE.SOUL) && this._status.pools[RESOURCE.SOUL].quantity < 0) {
            return true;
        }
        if (this.hasResource(RESOURCE.BLOOD)) {
            return this._status.pools[RESOURCE.BLOOD].quantity < 0;
        }
        if (this.hasResource(RESOURCE.FLESH)) {
            return this._status.pools[RESOURCE.FLESH].quantity < 0;
        }
        if (this.hasResource(RESOURCE.BONE)) {
            return this._status.pools[RESOURCE.BONE].quantity < 0;
        }
        return false; // TODO: more conditions? modify conditions?
    }
    public toJSON() {
        return {
            'attributes': this._cachedAttributes.toJSON(),
            'allocatedAttributes': this._allocatedAttributes.toJSON(),
            'attributeLevelupCosts': this._allocatedAttributes.getLevelupCosts().toJSON(),
            'skills': this._skills.toJSON(),
            'faiths': [],
            'race': this._race.toJSON(),
            'equipment': this._equipment.toJSON(),
            'status': this._status.toJSON(),
            'exp': this._essence,
        };
    }
    protected takeBluntDamage(amount: number) {
        // if fleshy, lower flesh to 0
        if (this.hasResource(RESOURCE.FLESH) && this._status.pools[RESOURCE.FLESH].quantity > 0) {
            if (this._status.pools[RESOURCE.FLESH].quantity > amount) {
                this._status.pools[RESOURCE.FLESH].quantity -= amount;
                return;
            }
            amount -= this._status.pools[RESOURCE.FLESH].quantity;
            this._status.pools[RESOURCE.FLESH].quantity = 0;
        }
        // then do flesh AND bone damage
        if (this.hasResource(RESOURCE.FLESH)) {
            this._status.pools[RESOURCE.FLESH].quantity -= amount;
        }
        if (this.hasResource(RESOURCE.BONE) && this._status.pools[RESOURCE.BONE].quantity > 0) {
            if (this._status.pools[RESOURCE.BONE].quantity > amount) {
                this._status.pools[RESOURCE.BONE].quantity -= amount;
                return;
            }
            amount -= this._status.pools[RESOURCE.FLESH].quantity;
            this._status.pools[RESOURCE.FLESH].quantity = 0;
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
        if (this._race.traits.includes('bloodless')) {
            this._hasPool[RESOURCE.BLOOD] = false;
        }
        if (this._race.traits.includes('boneless')) {
            this._hasPool[RESOURCE.BONE] = false;
        }
        this._cachedAttributes = this._race.getNetAttributes().getSumWith(this._allocatedAttributes);
        // TODO: apply effects that modify attributes
        this._status.pools[RESOURCE.FLESH].capacity = this.getNetAttributeValue(ATTRIBUTE.VITALITY);
        this._status.pools[RESOURCE.BLOOD].capacity = this.getNetAttributeValue(ATTRIBUTE.VITALITY) + this.getNetAttributeValue(ATTRIBUTE.ENDURANCE);
        this._status.pools[RESOURCE.BONE].capacity = this.getNetAttributeValue(ATTRIBUTE.VITALITY) + this.getNetAttributeValue(ATTRIBUTE.STRENGTH);
        this._status.pools[RESOURCE.SOUL].capacity = this.getNetAttributeValue(ATTRIBUTE.INTUITION) + this.getNetAttributeValue(ATTRIBUTE.CHARISMA);
        this._status.pools[RESOURCE.STAMINA].capacity = this.getNetAttributeValue(ATTRIBUTE.ENDURANCE);
        this._status.pools[RESOURCE.MANA].capacity = this.getNetAttributeValue(ATTRIBUTE.INTUITION);
        this._status.max_action_points = (this.getNetAttributeValue(ATTRIBUTE.SPEED) * 5) + 10;
        this._status.action_point_recovery = (this.getNetAttributeValue(ATTRIBUTE.SPEED) * 2) + 5;
    }
}
