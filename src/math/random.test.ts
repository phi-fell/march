import { Random } from './random';

describe('Random', () => {
    const random = new Random('test');
    const s = random.getDeterministicID();
    const baseline = new Random(s);
    const duplicate = new Random(s);
    describe('#float', () => {
        it('should return between [0,1)', () => {
            for (let i = 0; i < 100; i++) {
                const f = baseline.float();
                expect(f).toBeLessThan(1)
                expect(f).toBeGreaterThanOrEqual(0);
            }
            for (let i = 0; i < 100; i++) {
                const f = duplicate.float();
                expect(f).toBeLessThan(1);
                expect(f).toBeGreaterThanOrEqual(0);
            }
        });
        it('should be deterministic', () => {
            for (let i = 0; i < 100; i++) {
                const b = baseline.float();
                const d = duplicate.float();
                expect(b).toEqual(d);
            }
        });
    });
});
