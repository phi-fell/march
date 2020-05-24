import fs = require('fs');
import * as t from 'io-ts';
import { CharacterAttributes } from './characterattributes';
import { CharacterTrait } from './charactertrait';

export enum BODY_SIZE {
    MINISCULE, // ants, fleas, etc.                                 no bigger than a dime.
    DIMINUTIVE, // mice, butterflies, small birds, etc.             dime sized to baseball sized.
    TINY, // cats, small dogs, etc                                  baseball sized to basketball sized
    SMALL, // most dogs, human children, etc.
    MEDIUM, // humans, big dogs, etc
    LARGE, // bigger than a human.  e.g. horses, minotaurs, etc.    this is the largest size that can occupy a single tile
    HUGE, // elephant sized, or such.
    GIANT, // the size of a 5-10 story building, or such
    COLLOSAL, // the size of a skyscraper, or bigger
}

export enum TEMPERATURE {
    SUB_FREEZING,
    FREEZING,
    VERY_COLD,
    COLD,
    COOL,
    SLIGHT_COOL,
    AMBIENT,
    SLIGHT_WARMTH,
    WARM,
    HOT,
    VERY_HOT,
    BOILING,
    BLAZING,
}
// races should be default be -
//      cold blooded: AMBIENT when still, SLIGHT_WARMTH when in motion (or ideally have them keep temp from last area until they acclimate)
//      warm blooded: WARM when still or in motion

export enum SCENT {
    NONE,
    NEGLIGIBLE,
    SOME,
    SMELLY,
    VERY_SMELLY,
}

// races should be default have scent SOME
// TODO: add traits like "stinky" that make e.g. gobins be SMELLY, etc.

export enum SOUND {
    NONE,       // no sound at all, sound not detectable by any means
    INAUDIBLE,  // nigh inaudible, the sound of an ant's footstep or somesuch
    VERY_QUIET, // the sound of a person quietly breathing, or their heartbeat
    QUIET,      // the sound of a theif sneaking
    NORMAL,     // the sound of a normal person walking
    LOUD,       // the sound of a normal person joggin or sprinting
    VERY_LOUD,  // the sound of steel clashing with steel
    DEAFENING,  // the sound of a gunshot
}

// walking should be normal sound
// fast_movement and sprinting should be loud (sprinting will take more stamina than fast_movement)
// sneaking should be quiet (and class bonuses or skills might make one even quieter, or at least have a possibility of such)

export type CharacterRaceID = string;
export const NO_RACE = '' as CharacterRaceID;

interface CharacterRaceProperties {
    name: string;
    description: string;
    playable: boolean;
    bodySize: BODY_SIZE;
    baseAttributes: CharacterAttributes;
    traits: string[];
}

const characterRaceProps: { [id: string]: CharacterRaceProperties; } = {};

characterRaceProps[NO_RACE] = {
    'name': 'None',
    'description': '',
    'playable': false,
    'bodySize': BODY_SIZE.MEDIUM,
    'baseAttributes': new CharacterAttributes(),
    'traits': [],
};

type CharacterRaceSchema = t.TypeOf<typeof CharacterRace.schema>;

export class CharacterRace {
    public static schema = t.type({
        'raceID': t.string,
        'name': t.string,
        'description': t.string,
        'playable': t.boolean,
        'bodySize': t.string,
        'baseAttributes': CharacterAttributes.schema,
        'traits': t.array(CharacterTrait.schema),
    });

    public static getRaceList() {
        return Object.entries(characterRaceProps);
    }
    public static getPlayableRaces() {
        return Object.entries(characterRaceProps).filter((pair) => pair[1].playable);
    }
    public static getPlayableRacesJSONString() {
        return JSON.stringify(CharacterRace.getPlayableRaces());
    }
    public static raceExists(id: string) {
        return characterRaceProps.hasOwnProperty(id);
    }
    public static fromJSON(json: CharacterRaceSchema) {
        return new CharacterRace(json.raceID);
    }
    constructor(private raceID: CharacterRaceID = NO_RACE) {
    }
    get playable() {
        return characterRaceProps[this.raceID].playable;
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
    get traits() {
        return characterRaceProps[this.raceID].traits;
    }
    public getEssenceCost(): number {
        return 0;
    }
    public getNetAttributes() {
        return this.baseAttributes.clone();
    }
    public toJSON(): CharacterRaceSchema {
        const props = characterRaceProps[this.raceID];
        return {
            'raceID': this.raceID,
            'name': this.name,
            'description': this.description,
            'playable': props.playable,
            'bodySize': BODY_SIZE[props.bodySize],
            'baseAttributes': props.baseAttributes.toJSON(),
            'traits': this.traits.map((trait) => CharacterTrait.get(trait).toJSON()),
        };
    }
}

fs.readdir('res/race', (dir_err, filenames) => {
    if (dir_err) {
        return console.log(dir_err);
    }
    filenames.forEach((filename) => {
        fs.readFile('res/race/' + filename, 'utf-8', (read_err, content) => {
            if (read_err) {
                return console.log(read_err);
            }
            const name = filename.split('.')[0];
            const props = JSON.parse(content);
            props.baseAttributes = CharacterAttributes.fromJSON(props.baseAttributes);
            props.bodySize = BODY_SIZE[props.bodySize];
            characterRaceProps[name] = props;
        });
    });
});
