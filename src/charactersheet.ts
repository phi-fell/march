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
        return ret;
    }
    private _attributes: CharacterAttributes;
    private _origin: CharacterOrigin;
    private _classes: CharacterClass[];
    private _faiths: CharacterFaith[];
    constructor() {
        this._attributes = new CharacterAttributes();
        this._origin = new CharacterOrigin(ORIGIN.NONE);
        this._classes = [];
        this._faiths = [];
    }
    get origin() {
        return this._origin;
    }
    set origin(or: CharacterOrigin) {
        this._origin = or;
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
        };
    }
}
