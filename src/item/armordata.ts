export class ArmorData {
    public static fromJSON(json: any) {
        return new ArmorData(json.coverage, json.resilience, json.armor);
    }
    constructor(public coverage: number, public resilience: number, public armor: number) { }
    public toJSON() {
        return {
            'coverage': this.coverage,
            'resilience': this.resilience,
            'armor': this.armor,
        };
    }
    public clone(): ArmorData {
        return new ArmorData(this.coverage, this.resilience, this.armor);
    }
}
