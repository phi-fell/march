import * as t from 'io-ts';

import { Random } from '../math/random';
import { CharacterResource, RESOURCE } from './characterresource';

export type CharacterStatusSchema = t.TypeOf<typeof CharacterStatus.schema>;

export class CharacterStatus {
    public static schema = t.intersection([
        t.type({
            'action_points': t.number,
            'max_action_points': t.number,
            'action_point_recovery': t.number,
        }),
        t.partial(Object.keys(RESOURCE).reduce((all, res) => {
            if (isNaN(Number(res))) {
                all[res as keyof typeof RESOURCE] = t.type({
                    'quantity': t.number,
                    'capacity': t.number,
                });
            }
            return all;
        }, {} as Record<keyof typeof RESOURCE, t.TypeC<{ quantity: t.NumberC, capacity: t.NumberC }>>)),
    ]);
    public static fromJSON(json: CharacterStatusSchema) {
        const ret = new CharacterStatus();
        ret.action_points = json.action_points;
        ret.max_action_points = json.max_action_points;
        ret.action_point_recovery = json.action_point_recovery;
        for (const pool of ret.pools) {
            const json_pool = json[RESOURCE[pool.resource_type] as keyof typeof RESOURCE];
            if (json_pool) {
                pool.quantity = json_pool.quantity;
                pool.capacity = json_pool.capacity;
            }
        }
        return ret;
    }
    public pools: CharacterResource[] = [];
    public action_points: number = 0;
    public max_action_points: number = 60;
    public action_point_recovery: number = 25;
    private _rest: number = -1;
    constructor() {
        for (const type in RESOURCE) {
            if (isNaN(Number(type))) {
                this.pools[RESOURCE[type as keyof typeof RESOURCE]] = new CharacterResource(RESOURCE[type as keyof typeof RESOURCE]);
            }
        }
    }
    public restoreFully() {
        this.action_points = this.max_action_points;
        for (const type in RESOURCE) {
            if (isNaN(Number(type))) {
                (this.pools[RESOURCE[type as keyof typeof RESOURCE]] as CharacterResource).refillToCapacity();
            }
        }
    }
    public startNewTurn() {
        if (this._rest === 0) {
            this._rest = 1;
        } else if (this._rest === 1) {
            this._rest = 0;
            this.restOneTurn();
        }
        this.action_points += this.action_point_recovery;
        if (this.action_points > this.max_action_points) {
            this.action_points = this.max_action_points;
        }
        if (this.pools[RESOURCE.FLESH].quantity < 0) {
            this.pools[RESOURCE.BLOOD].quantity += Math.floor(this.pools[RESOURCE.FLESH].quantity / 10);
        }
    }
    public startRest() {
        if (this._rest === -1) {
            this._rest = 0;
        }
    }
    public endRest() {
        this._rest = -1;
    }
    public toJSON(): CharacterStatusSchema {
        return this.pools.reduce(
            (pools: CharacterStatusSchema, pool: CharacterResource) => {
                pools[RESOURCE[pool.resource_type] as keyof typeof RESOURCE] = {
                    'quantity': pool.quantity,
                    'capacity': pool.capacity,
                };
                return pools;
            }, {
                'action_points': this.action_points,
                'max_action_points': this.max_action_points,
                'action_point_recovery': this.action_point_recovery,
            } as CharacterStatusSchema,
        );
    }
    private restOneTurn() {
        if (this.action_points < this.max_action_points) {
            return;
        }
        let flesh_ratio = this.pools[RESOURCE.FLESH].quantity / this.pools[RESOURCE.FLESH].capacity;
        let blood_ratio = this.pools[RESOURCE.BLOOD].quantity / this.pools[RESOURCE.BLOOD].capacity;
        flesh_ratio = Math.max(flesh_ratio, 0.05);
        blood_ratio = Math.max(blood_ratio, 0.05);
        if (this.pools[RESOURCE.FLESH].quantity < this.pools[RESOURCE.FLESH].capacity) {
            this.pools[RESOURCE.FLESH].quantity += Math.floor(Random.float() + blood_ratio);
        }
        if (this.pools[RESOURCE.BLOOD].quantity < this.pools[RESOURCE.BLOOD].capacity) {
            this.pools[RESOURCE.BLOOD].quantity += Math.floor(Random.float() + flesh_ratio);
        }
        if (this.pools[RESOURCE.BONE].quantity < this.pools[RESOURCE.BONE].capacity) {
            this.pools[RESOURCE.BONE].quantity += Math.floor(Random.float() * blood_ratio * flesh_ratio * 1.05);
        }
    }
}
