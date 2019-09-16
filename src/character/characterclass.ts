import { CharacterAttributes } from './characterattributes';

export class CharacterClass {
    public getNetAttributes(): CharacterAttributes {
        return new CharacterAttributes();
    }
}