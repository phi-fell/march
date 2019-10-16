import fs = require('fs');

export type CharacterTraitID = string;

const characterTraits: { [id: string]: CharacterTrait; } = {};

export class CharacterTrait {
    public static getTraitList() {
        return Object.entries(characterTraits);
    }
    public static getTraitsJSONString() {
        return JSON.stringify(CharacterTrait.getTraitList());
    }
    public static traitExists(id) {
        return characterTraits.hasOwnProperty(id);
    }
    public static get(id: CharacterTraitID) {
        return characterTraits[id];
    }
    public static fromJSON(json: any) {
        return CharacterTrait.get(json.id);
    }
    constructor(
        public id: CharacterTraitID,
        public buyable: boolean,
        public cost: number,
        public name: string,
        public description: string,
        public effects: string[]
    ) { }
    public getEssenceCost(): number {
        return this.cost;
    }
    public toJSON() {
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

fs.readdir('res/trait', (err, filenames) => {
    if (err) {
        return console.log(err);
    }
    filenames.forEach((filename) => {
        fs.readFile('res/trait/' + filename, 'utf-8', (err, content) => {
            if (err) {
                return console.log(err);
            }
            const id = filename.split('.')[0];
            const json = JSON.parse(content);
            characterTraits[id] = new CharacterTrait(id, json.buyable, json.cost, json.name, json.description, json.effects.map((effect) => /*CharacterEffect.get(*/effect/*)*/)); // TODO: uncomment block comments once effects are a class rather than a raw string
        });
    });
});