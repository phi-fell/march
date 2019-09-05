export class Vec2 {
    constructor(public x: number, public y: number) { }
    public sqmag(): number {
        return (this.x * this.x) + (this.y * this.y);
    }
    public mag(): number {
        return Math.sqrt(this.sqmag());
    }
    public getScaled(s: number): Vec2 {
        return new Vec2(this.x * s, this.y * s);
    }
    public getNormalized(): Vec2 {
        const mag = this.mag();
        return new Vec2(this.x / mag, this.y / mag);
    }
    public getWithMag(m: number) {
        return this.getNormalized().getScaled(m);
    }
}