import { CharacterAttributes } from "./characterattributes";

export class CharacterClass {
    getAttributes(): CharacterAttributes {
        return new CharacterAttributes();
    }
}