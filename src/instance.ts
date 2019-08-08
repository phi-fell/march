import uuid = require('uuid/v4');

export class Instance {
    width: number;
    height: number;
    constructor(public id: string, public attributes: InstanceAttributes) {
        this.width = attributes.width;
        this.height = attributes.height;
    }
    static generateNewInstanceID() {
        return uuid();
    }
    static generateRandomInstance() {
        var attr:InstanceAttributes = new InstanceAttributes(4/* chosen by fair dice roll. guaranteed to be random */, 10, 10);
        return new Instance(this.generateNewInstanceID(), attr);
    }
}
export class InstanceAttributes {
    constructor(public seed: number/*TODO: string?*/,
        public width: number,
        public height: number) {
    }
}