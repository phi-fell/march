import uuid = require('uuid/v4');
import { Player } from './player';

export class Instance {
    width: number;
    height: number;
    players: Player[];
    constructor(public id: string, public attributes: InstanceAttributes) {
        this.width = attributes.width;
        this.height = attributes.height;
        this.players = [];
    }
    updateAllPlayers(){
        for (var plr of this.players){
            plr.pushUpdate();
        }
    }
    static generateNewInstanceID() {
        return uuid();
    }
    static generateRandomInstance() {
        var attr: InstanceAttributes = new InstanceAttributes(4/* chosen by fair dice roll. guaranteed to be random */, 10, 10);
        return new Instance(this.generateNewInstanceID(), attr);
    }
}
export class InstanceAttributes {
    constructor(public seed: number/*TODO: string?*/,
        public width: number,
        public height: number) {
    }
}