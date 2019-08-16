import { CharacterClass } from "./characterclass";
import { CharacterFaith } from "./characterfaith";
import { CharacterAttributes, ATTRIBUTE } from "./characterattributes";
import { CharacterOrigin, ORIGIN } from "./characterorigin";

export class CharacterSheet {
    private _classes: CharacterClass[];
    private _faiths: CharacterFaith[];
    private _origin: CharacterOrigin;
    private _attributes: CharacterAttributes;
    constructor() {
        this._classes = [];
        this._faiths = [];
        this._origin = new CharacterOrigin(ORIGIN.NONE);
        this._attributes = new CharacterAttributes();
    }
    get origin() {
        return this._origin;
    }
    set origin(or: CharacterOrigin) {
        this._origin = or;
    }
    getUnclassedAttributeValue(attr: ATTRIBUTE) {
        return this._attributes.get(attr);
    }
    getNetAttributeValue(attr: ATTRIBUTE) {
        if (this._classes.length > 0) {
            var net = this._attributes;
            for (var i = 0; i < this._classes.length; i++) {
                net = net.getSumWith(this._classes[i].getAttributes());
            }
            return net.get(attr);
        } else {
            return this._attributes.get(attr);
        }
    }
    toJSON() {
        return {
            'classes': [],
            'faiths': [],
            'origin': this._origin.toJSON(),
            'attributes': this._attributes.toJSON(),
        }
    }
    static fromJSON(json) {
        var ret = new CharacterSheet();
        //TODO load classes
        //TODO load faiths
        ret._origin = CharacterOrigin.fromJSON(json.origin);
        ret._attributes = CharacterAttributes.fromJSON(json.attributes);
        return ret;
    }
}