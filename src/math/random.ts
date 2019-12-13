import { randomBytes } from 'crypto';
import uuid_rand = require('uuid/v4');
import uuid_deterministic = require('uuid/v5');

export class Random {
    public static getSecureID() {
        return randomBytes(16).toString('hex');
    }
    public static float() {
        return Random.r.float();
    }
    public static floatRange(min_inclusive: number, max_exclusive: number): number {
        return Random.r.floatRange(min_inclusive, max_exclusive);
    }
    public static int(min_inclusive: number, max_exclusive: number): number {
        return Random.r.int(min_inclusive, max_exclusive);
    }
    public static uuid() {
        return uuid_rand();
    }
    public static getDeterministicID(): string {
        return Random.r.getDeterministicID();
    }
    public static reSeed(seed: string) {
        Random.r.reSeed(seed);
    }
    private static r = new Random();
    private state: number[] = [];
    constructor(private seed: string = Random.uuid()) {
        this.reSeed(seed);
    }
    public reSeed(seed: string) {
        this.seed = seed;
        let hash = 1779033703 ^ seed.length;
        for (let i = 0; i < seed.length; i++) {
            hash = Math.imul(hash ^ seed.charCodeAt(i), 3432918353);
            hash = hash << 13 | hash >>> 19;
        }
        for (let i = 0; i < 4; i++) {
            hash = Math.imul(hash ^ hash >>> 16, 2246822507);
            hash = Math.imul(hash ^ hash >>> 13, 3266489909);
            this.state[i] = (hash ^= hash >>> 16) >>> 0;
        }
    }
    public float(): number {
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
    public floatRange(min_inclusive: number, max_exclusive: number): number {
        return (this.float() * (max_exclusive - min_inclusive)) + min_inclusive;
    }
    public int(min_inclusive: number, max_exclusive: number): number {
        return Math.floor(this.floatRange(min_inclusive, max_exclusive));
    }
    public getDeterministicID(): string {
        return uuid_deterministic(
            '' + this.float() + ', ' + this.float() + ', ' + this.float() + ', ' + this.float(),
            uuid_deterministic.URL,
        );
    }
}
