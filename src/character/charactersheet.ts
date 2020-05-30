import * as t from 'io-ts';
import { Damage, DamageMetaData, DAMAGE_TYPE } from '../damage';
import { Random } from '../math/random';
import type { Entity } from '../world/entity';
import type { AttackEvent } from '../world/event/attack_event';
import { ATTRIBUTE, CharacterAttributes } from './characterattributes';
import { CharacterEquipment } from './characterequipment';
import type { CharacterFaith } from './characterfaith';
import { CharacterRace } from './characterrace';
import { RESOURCE } from './characterresource';
import { CharacterSkills } from './characterskills';
import { CharacterStatus } from './characterstatus';
import { CharacterTrait } from './charactertrait';

export const STARTING_ESSENCE = 100;

export type CharacterSheetSchema = t.TypeOf<typeof CharacterSheet.schema>;

export class CharacterSheet {
    public static schema = t.intersection([
        t.type({
            'equipment': CharacterEquipment.schema,
            'race': CharacterRace.schema,
            'traits': t.array(CharacterTrait.schema),
            'skills': CharacterSkills.schema,
            'status': CharacterStatus.schema,
            'allocatedAttributes': CharacterAttributes.schema,
            'essence': t.number,
            'exp': t.number,
        }),
        t.partial({
            'attributes': CharacterAttributes.schema,
            'attributeLevelupCosts': t.any,
            'faiths': t.any, // TODO: faith schema
            'exp_cap': t.number,
        }),
    ]);

    public static newPlayerSheet() {
        const ret = new CharacterSheet();
        ret.race = new CharacterRace('avrilen');
        ret._essence = STARTING_ESSENCE;
        return ret;
    }
    public static fromJSON(json: CharacterSheetSchema) {
        const ret = new CharacterSheet();
        ret._additional_traits = json.traits.map(CharacterTrait.fromJSON);
        // TODO: load faiths
        ret._equipment = CharacterEquipment.fromJSON(json.equipment);
        ret._race = CharacterRace.fromJSON(json.race);
        ret.allocatedAttributes = CharacterAttributes.fromJSON(json.allocatedAttributes);
        ret._skills = CharacterSkills.fromJSON(json.skills);
        ret._status = CharacterStatus.fromJSON(json.status);
        ret._essence = json.essence;
        ret._exp = json.exp;
        ret.recalculateDerivedStats();
        return ret;
    }
    public allocatedAttributes: CharacterAttributes = new CharacterAttributes();
    private _skills: CharacterSkills = new CharacterSkills();
    private _race: CharacterRace;
    private _additional_traits: CharacterTrait[] = [];
    private _faiths: CharacterFaith[] = [];
    private _equipment: CharacterEquipment;
    private _status: CharacterStatus;
    private _essence: number;
    private _exp: number;
    // cache
    private _cachedAttributes: CharacterAttributes = new CharacterAttributes();
    private _hasPool: boolean[] = [];
    constructor() {
        this._race = new CharacterRace();
        this._equipment = new CharacterEquipment();
        this._status = new CharacterStatus();
        this._essence = 0;
        this._exp = 0;
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
    set status(s: CharacterStatus) {
        this._status = s;
    }
    get equipment() {
        return this._equipment;
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
        while (amount > 0) {
            let ratio = amount / this.getEssenceWorth();
            ratio *= ratio;
            if (this._exp + (ratio * amount) > this.getEssenceWorth()) {
                amount -= (this.getEssenceWorth() - this._exp) / ratio;
                this._exp = 0;
                this._essence++;
            } else {
                this._exp += ratio * amount;
                amount = 0;
            }
        }
    }
    public getNetAttributeValue(attr: ATTRIBUTE): number {
        return this._cachedAttributes.get(attr);
    }
    public getInitiative() {
        return this.status.action_points + this.getNetAttributeValue(ATTRIBUTE.PERCEPTION);
    }
    public levelUpAttribute(attr: ATTRIBUTE) {
        const costs = this.allocatedAttributes.getLevelupCosts();
        if (this._essence >= costs.get(attr)) {
            this._essence -= costs.get(attr);
            this.allocatedAttributes.set(attr, this.allocatedAttributes.get(attr) + 1);
            this.recalculateDerivedStats();
        } else {
            // Failure
        }
    }
    public levelDownAttribute(attr: ATTRIBUTE) {
        if (this.allocatedAttributes.get(attr) > 0) {
            this.allocatedAttributes.set(attr, this.allocatedAttributes.get(attr) - 1);
            this._essence += this.allocatedAttributes.getLevelupCosts().get(attr);
            this.recalculateDerivedStats();
        } else {
            // Failure
        }
    }
    public addTrait(trait: CharacterTrait) {
        if (trait.buyable && this._essence >= trait.cost) {
            this._essence -= trait.cost;
            this._additional_traits.push(trait);
        }
    }
    public removeTrait(index: number) {
        if (index >= 0 && index < this._additional_traits.length) {
            this._essence += this._additional_traits[index].cost;
            this._additional_traits.splice(index, 1);
        } else {
            console.log('could not remove trait[' + index + '] from traits');
        }
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
    public takeHit(event: AttackEvent) {
        const attacker_sheet = event.attacker.getComponent('sheet');
        if (attacker_sheet === undefined) {
            console.log('Attacker has no sheet!');
            event.success = false;
            return;
        }
        const weapon = attacker_sheet.equipment.getWeapon();
        // TODO: combat calculations (not complete)
        /*
            chance to dodge: along the lines of hit_success=(1D20 + attacker.DEX) >= (1D20 + defender.AGI) or something
            if dodged do nothing (return);
            if hit, do armor coverage
            roll (attacker.dex + weapon [precision) against (defender agi + total armor coverage)
            if attacker.wins, do damage as if defendor has no armor
            else: see below code
        */
        // take a hit, first applying chance to dodge, etc.
        const dodgeChance = 0;
        // TODO: multiple classes of hit: critical, direct, glancing, miss
        // e.g. critical could be a hit to head or vital region: +damage (maybe double dmg?)
        // e.g. direct is normal
        // e.g. glancing is almost dodge but not quite. (half? damage)
        if (Random.float() >= dodgeChance) {
            event.success = true;
            let armor = 0; // TODO: calculate total armor
            let blunt = attacker_sheet.getNetAttributeValue(ATTRIBUTE.STRENGTH) + (weapon ? (weapon.weapon_data.force) : 0); // [str]D[force] ?
            event.damage.push(new Damage(DAMAGE_TYPE.BLUNT, blunt, new DamageMetaData(blunt, blunt, blunt, armor, 0)));
            if (blunt > armor) {
                blunt -= armor;
                armor = 0;
                this.takeBluntDamage(blunt);
            } else {
                armor -= blunt;
                blunt = 0;
            }
            const resilience = 0; // TODO: calculate resilience from natural armor, or equipment
            const piercing = weapon ? (weapon.weapon_data.piercing) : 0;
            if (piercing > resilience) {
                const sharp = (piercing - resilience) * (weapon ? (weapon.weapon_data.sharpness) : 0); // [pierce-res]D[sharp] ?
                event.damage.push(new Damage(DAMAGE_TYPE.SHARP, sharp, new DamageMetaData(sharp, sharp, sharp, armor, 0)));
                if (sharp > armor) {
                    this.takeSharpDamage(sharp - armor);
                }
            }
        } else {
            event.success = false;
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
    public getEssenceWorth() {
        return this._race.getEssenceCost() + this.allocatedAttributes.getEssenceCost() + this._skills.getEssenceCost() + this._essence;
    }
    public toJSON(): CharacterSheetSchema {
        return {
            'attributes': this._cachedAttributes.toJSON(),
            'allocatedAttributes': this.allocatedAttributes.toJSON(),
            'attributeLevelupCosts': this.allocatedAttributes.getLevelupCosts().toJSON(),
            'skills': this._skills.toJSON(),
            'traits': this._additional_traits.map((trait) => trait.toJSON()),
            'faiths': [],
            'race': this._race.toJSON(),
            'equipment': this._equipment.toJSON(),
            'status': this._status.toJSON(),
            'essence': this._essence,
            'exp_cap': this.getEssenceWorth(),
            'exp': this._exp,
        };
    }
    public getClientJSON(viewer: Entity) {
        const attributeLevelupAvailable = Object.fromEntries(
            Object.entries(this.allocatedAttributes.getLevelupCosts().toJSON()).map(
                ([k, v]) => [k, v >= this._essence]
            )
        ) as Record<keyof typeof ATTRIBUTE, boolean>;
        return {
            'attributes': this._cachedAttributes.toJSON(),
            attributeLevelupAvailable,
            'skills': this._skills.toJSON(),
            'traits': this._additional_traits.map((trait) => trait.toJSON()),
            'faiths': [],
            'race': this._race.toJSON(),
            'equipment': this._equipment.toJSON(),
            'status': this._status.toJSON(),
            'essence': this._essence,
            'exp_cap': this.getEssenceWorth(),
            'exp': this._exp,
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
            this._status.pools[RESOURCE.BONE].quantity -= amount;
        }
    }
    protected takeSharpDamage(amount: number) {
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
                this._hasPool[RESOURCE[type as keyof typeof RESOURCE]] = true;
            }
        }
        if (this._race.traits.includes('bloodless')) {
            this._hasPool[RESOURCE.BLOOD] = false;
        }
        if (this._race.traits.includes('boneless')) {
            this._hasPool[RESOURCE.BONE] = false;
        }
        this._cachedAttributes = this._race.getNetAttributes().getSumWith(this.allocatedAttributes);
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
