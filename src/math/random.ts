export class Random {
    private state: number[];
    constructor(seed: string) {
        let hash = 1779033703 ^ seed.length;
        for (let i = 0; i < seed.length; i++) {
            hash = Math.imul(hash ^ seed.charCodeAt(i), 3432918353);
            hash = hash << 13 | hash >>> 19;
        }
        this.state = [];
        for (let i = 0; i < 4; i++) {
            hash = Math.imul(hash ^ hash >>> 16, 2246822507);
            hash = Math.imul(hash ^ hash >>> 13, 3266489909);
            this.state[i] = (hash ^= hash >>> 16) >>> 0;
        }
    }
    public float() {
        this.state[0] >>>= 0; this.state[1] >>>= 0; this.state[2] >>>= 0; this.state[3] >>>= 0;
        let ret = (this.state[0] + this.state[1]) | 0;
        this.state[0] = this.state[1] ^ this.state[1] >>> 9;
        this.state[1] = this.state[2] + (this.state[2] << 3) | 0;
        this.state[2] = (this.state[2] << 21 | this.state[2] >>> 11);
        this.state[3] = this.state[3] + 1 | 0;
        ret = ret + this.state[3] | 0;
        this.state[2] = this.state[2] + ret | 0;
        return (ret >>> 0) / 4294967296;
    }
}
