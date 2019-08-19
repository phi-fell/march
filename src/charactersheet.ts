import { ATTRIBUTE, CharacterAttributes } from './characterattributes';
import { CharacterClass } from './characterclass';
import { CharacterFaith } from './characterfaith';
import { CharacterOrigin, ORIGIN } from './characterorigin';

export class CharacterSheet {
    public static fromJSON(json: any) {
        const ret = new CharacterSheet();
        // TODO: load classes
        // TODO: load faiths
        ret._origin = CharacterOrigin.fromJSON(json.origin);
        ret._attributes = CharacterAttributes.fromJSON(json.attributes);
        ret._experience = json.exp;
        return ret;
    }
    private _attributes: CharacterAttributes;
    private _origin: CharacterOrigin;
    private _classes: CharacterClass[];
    private _faiths: CharacterFaith[];
    private _experience: number;
    constructor() {
        this._attributes = new CharacterAttributes();
        this._origin = new CharacterOrigin(ORIGIN.NONE);
        this._classes = [];
        this._faiths = [];
        this._experience = 0;
    }
    get origin() {
        return this._origin;
    }
    set origin(or: CharacterOrigin) {
        this._origin = or;
    }
    public addExperience(amount: number) {
        this._experience += amount;
    }
    public getUnclassedAttributeValue(attr: ATTRIBUTE) {
        return this._attributes.get(attr);
    }
    public getNetAttributeValue(attr: ATTRIBUTE) {
        if (this._classes.length > 0) {
            let net = this._attributes;
            for (let i = 0; i < this._classes.length; i++) {
                net = net.getSumWith(this._classes[i].getAttributes());
            }
            return net.get(attr);
        } else {
            return this._attributes.get(attr);
        }
    }
    public toJSON() {
        return {
            'attributes': this._attributes.toJSON(),
            'classes': [],
            'faiths': [],
            'origin': this._origin.toJSON(),
            'exp': this._experience,
        };
    }
    public levelUpAttribute(attr: ATTRIBUTE) {
        if (this._experience >= 10) {
            this._experience -= 10; // TODO: experience should lead to levelups which grant attribute points. or something else like that
            this._attributes.set(attr, this._attributes.get(attr) + 1);
        }
    }
}
