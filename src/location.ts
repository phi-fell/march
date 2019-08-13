export class Location {
    constructor(public x: number, public y: number, public instance_id: string) {
    }
    getMovedBy(dx: number, dy: number) {
        return new Location(this.x + dx, this.y + dy, this.instance_id);
    }
    clone() {
        return new Location(this.x, this.y, this.instance_id);
    }
}