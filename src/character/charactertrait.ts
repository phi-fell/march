import fs = require('fs');
import * as t from 'io-ts';

export type CharacterTraitID = string;

const characterTraits: { [id: string]: CharacterTrait; } = {};

export type CharacterTraitSchema = t.TypeOf<typeof CharacterTrait.schema>;

export class CharacterTrait {
    public static schema = t.type({
        'id': t.string,
        'buyable': t.boolean,
        'cost': t.number,
        'name': t.string,
        'description': t.string,
        'effects': t.array(t.string),
    });

    public static getTraitList() {
        return Object.entries(characterTraits);
    }
    public static getBuyableTraits() {
        return CharacterTrait.getTraitList().filter((pair) => pair[1].buyable);
    }
    public static getBuyableTraitsJSONString() {
        return JSON.stringify(CharacterTrait.getBuyableTraits());
    }
    public static traitExists(id: string) {
        return characterTraits.hasOwnProperty(id);
    }
    public static get(id: CharacterTraitID) {
        return characterTraits[id];
    }
    public static fromJSON(json: CharacterTraitSchema) {
        return CharacterTrait.get(json.id);
    }
    constructor(
        public id: CharacterTraitID,
        public buyable: boolean,
        public cost: number,
        public name: string,
        public description: string,
        public effects: string[],
    ) { }
    public getEssenceCost(): number {
        return this.cost;
    }
    public toJSON(): CharacterTraitSchema {
        return {
            'id': this.id,
            'buyable': this.buyable,
            'cost': this.cost,
            'name': this.name,
            'description': this.description,
            'effects': this.effects.map((effect) => effect/*.toJSON()*/), // TODO: uncomment '.toJSON()' once effects are a class rather than a raw string
        };
    }
}

fs.readdir('res/trait', (dir_err, filenames) => {
    if (dir_err) {
        return console.log(dir_err);
    }
    filenames.forEach((filename) => {
        fs.readFile('res/trait/' + filename, 'utf-8', (read_err, content) => {
            if (read_err) {
                return console.log(read_err);
            }
            const id = filename.split('.')[0];
            const json = JSON.parse(content);
            characterTraits[id] = new CharacterTrait(id, json.buyable, json.cost, json.name, json.description, json.effects.map((effect: string) => /*CharacterEffect.get(*/effect/*)*/)); // TODO: uncomment block comments once effects are a class rather than a raw string
        });
    });
});
