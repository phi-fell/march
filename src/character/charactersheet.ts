import { ATTRIBUTE, CharacterAttributes } from './characterattributes';
import { CharacterClass } from './characterclass';
import { CharacterEquipment } from './characterequipment';
import { CharacterFaith } from './characterfaith';
import { CharacterRace } from './characterrace';
import { RESOURCE } from './characterresource';
import { CharacterStatus } from './characterstatus';

export class CharacterSheet {
    public static fromJSON(json: any) {
        const ret = new CharacterSheet();
        // TODO: load classes
        // TODO: load faiths
        ret._race = CharacterRace.fromJSON(json.race);
        ret._attributes = CharacterAttributes.fromJSON(json.attributes);
        ret._experience = json.exp;
        return ret;
    }
    private _race: CharacterRace;
    private _classes: CharacterClass[];
    private _faiths: CharacterFaith[];
    private _equipment: CharacterEquipment;
    private _status: CharacterStatus;
    private _experience: number;
    // cache
    private _attributes: CharacterAttributes = new CharacterAttributes();
    private _hasPool: boolean[] = [];
    constructor() {
        this._race = new CharacterRace();
        this._classes = [];
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
        return this._attributes.get(attr);
    }
    public levelUpAttribute(attr: ATTRIBUTE) {
        if (this._experience >= 10) {
            this._experience -= 10; // TODO: experience should lead to levelups which grant attribute points. or something else like that
            this._attributes.set(attr, this._attributes.get(attr) + 1);
        }
    }
    public startNewTurn() {
        this._status.startNewTurn();
    }
    public takeHit(amount) {
        // take a hit, first applying chance to dodge, etc.
        const dodgeChance = 0;
        if (Math.random() >= dodgeChance) {
            this.takeDamage(amount);
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
            'attributes': this._attributes.toJSON(),
            'classes': [],
            'faiths': [],
            'race': this._race.toJSON(),
            'status': this._status.toJSON(),
            'exp': this._experience,
        };
    }
    protected takeDirectHealthDamage(amount) {
        // take this damage directly to health and then account for effects (e.g. dying if health = 0 or whatever)
        // this functions is basically just health -= amount
        this._status.pools[RESOURCE.FLESH].quantity -= amount;
    }
    protected takeNetDamage(amount) {
        // apply this damage without accounting for armor, resistances, etc.
        // this function handles e.g. applying the damage first to a magical energy shield before actual health, or whatnot
        let shield = 0; // for example purposes. (should probably add a 'takeDirectShieldDamage' function if this were a feature)
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
    private recalculateDerivedStats() {
        for (const type in RESOURCE) {
            if (isNaN(Number(type))) {
                this._hasPool[RESOURCE[type]] = true;
            }
        }
        this._attributes = this._race.getNetAttributes();
        for (const charClass of this._classes) {
            this._attributes = this._attributes.getSumWith(charClass.getNetAttributes());

        }
        // TODO: apply effects that modify attributes
        this._status.pools[RESOURCE.FLESH].capacity = this.getNetAttributeValue(ATTRIBUTE.VITALITY);
        this._status.pools[RESOURCE.BLOOD].capacity = this.getNetAttributeValue(ATTRIBUTE.VITALITY) + this.getNetAttributeValue(ATTRIBUTE.ENDURANCE);
        this._status.pools[RESOURCE.BONE].capacity = this.getNetAttributeValue(ATTRIBUTE.VITALITY) + this.getNetAttributeValue(ATTRIBUTE.STRENGTH);
        this._status.pools[RESOURCE.SOUL].capacity = this.getNetAttributeValue(ATTRIBUTE.WILLPOWER);
        this._status.pools[RESOURCE.STAMINA].capacity = this.getNetAttributeValue(ATTRIBUTE.ENDURANCE);
        this._status.pools[RESOURCE.MANA].capacity = this.getNetAttributeValue(ATTRIBUTE.WISDOM);
    }
}
