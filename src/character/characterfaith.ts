export class CharacterFaith {
    public conviction: number; // "belief" - how fervently one believes in a deity
    public piety: number; // being a good follower: obeyind deity's edicts, praying often, being virtuous (by your god's standards)
    public favour: number; // current standing with a deity.  how much they like or owe you. can be used to cast spells or be granted divine aid
    constructor() {
        this.conviction = 0;
        this.piety = 0;
        this.favour = 0;
    }
}
