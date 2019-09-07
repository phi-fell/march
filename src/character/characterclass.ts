import { CharacterAttributes } from './characterattributes';

export class CharacterClass {
    public getAttributes(): CharacterAttributes {
        return new CharacterAttributes();
    }
}