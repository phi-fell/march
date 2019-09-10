import fs = require('fs');
import { CharacterAttributes } from './characterattributes';

export enum BODY_SIZE {
    MINISCULE, // ants, fleas, etc.                                 no bigger than a dime.
    DIMINUTIVE, // mice, butterflies, small birds, etc.             dime sized to baseball sized.
    TINY, // cats, small dogs, etc  baseball                        baseball sized to basketball sized
    SMALL, // most dogs, human children, etc.
    MEDIUM, // humans, big dogs, etc
    LARGE, // bigger than a human.  e.g. horses, minotaurs, etc.    this is the largest size that can occupy a single tile
    HUGE, // elephant sized, or such.
    GIANT, // the size of a 5-10 story building, or such
    COLLOSAL, // the size of a skyscraper, or bigger
}

export type CharacterRaceID = string;
export const NO_RACE = '' as CharacterRaceID;


interface CharacterRaceProperties {
    name: string;
    description: string;
    bodySize: BODY_SIZE;
    baseAttributes: CharacterAttributes;
    attributesPerLevel: CharacterAttributes;
}

const characterRaceProps: { [id: string]: CharacterRaceProperties; } = {};

characterRaceProps[NO_RACE] = {
    'name': 'None',
    'description': '',
    'bodySize': BODY_SIZE.MEDIUM,
    'baseAttributes': new CharacterAttributes(),
    'attributesPerLevel': new CharacterAttributes(),
};

export class CharacterRace {
    public static fromJSON(json) {
        return new CharacterRace(json.raceID, json.level);
    }
    constructor(private raceID: CharacterRaceID = NO_RACE, public level = 0) {
    }
    get name() {
        return characterRaceProps[this.raceID].name;
    }
    get description() {
        return characterRaceProps[this.raceID].description;
    }
    get bodySize() {
        return characterRaceProps[this.raceID].bodySize;
    }
    get baseAttributes() {
        return characterRaceProps[this.raceID].baseAttributes.clone();
    }
    get attributesPerLevel() {
        return characterRaceProps[this.raceID].attributesPerLevel.clone();
    }
    public getNetAttributes() {
        return this.baseAttributes.getSumWith(this.attributesPerLevel.getScaledBy(this.level)).getFloored();
    }
    public toJSON() {
        return {
            'raceID': this.raceID,
            'level': this.level,
            'name': this.name,
            'description': this.description,
        };
    }
}

fs.readdir('res/races', (err, filenames) => {
    if (err) {
        return console.log(err);
    }
    filenames.forEach((filename) => {
        fs.readFile('res/races/' + filename, 'utf-8', (err, content) => {
            if (err) {
                return console.log(err);
            }
            const name = filename.split('.')[0];
            const props = JSON.parse(content);
            props.attributes = CharacterAttributes.fromJSON(props.baseAttributes);
            characterRaceProps[name] = props;
        });
    });
});