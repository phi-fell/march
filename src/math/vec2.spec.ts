import 'mocha';

import { expect } from 'chai';

import { Vec2 } from './vec2';

describe('Vec2', () => {
    describe('#mag', () => {
        it('should return 1 for unit vecs', () => {
            const vecs = [new Vec2(0, 1), new Vec2(1, 0), new Vec2(0, -1), new Vec2(-1, 0)];
            for (const vec of vecs) {
                expect(vec.mag()).to.equal(1);
            }
        });
        it('should return 5 for 3 by 4 vecs', () => {
            const vecs = [new Vec2(3, 4), new Vec2(3, -4), new Vec2(-3, 4), new Vec2(-3, -4),
            new Vec2(4, 3), new Vec2(4, -3), new Vec2(-4, 3), new Vec2(-4, -3)];
            for (const vec of vecs) {
                expect(vec.mag()).to.equal(5);
            }
        });
    });
    describe('#sqmag', () => {
        it('should return 1 for unit vecs', () => {
            const vecs = [new Vec2(0, 1), new Vec2(1, 0), new Vec2(0, -1), new Vec2(-1, 0)];
            for (const vec of vecs) {
                expect(vec.sqmag()).to.equal(1);
            }
        });
        it('should return 25 for 3 by 4 vecs', () => {
            const vecs = [new Vec2(3, 4), new Vec2(3, -4), new Vec2(-3, 4), new Vec2(-3, -4),
            new Vec2(4, 3), new Vec2(4, -3), new Vec2(-4, 3), new Vec2(-4, -3)];
            for (const vec of vecs) {
                expect(vec.sqmag()).to.equal(25);
            }
        });
    });
});
