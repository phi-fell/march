import { Random } from '../math/random';
import { CharacterResource, RESOURCE } from './characterresource';

export class CharacterStatus {
    public static fromJSON(json: any) {
        const ret = new CharacterStatus();
        ret.action_points = json.action_points;
        ret.max_action_points = json.max_action_points;
        ret.action_point_recovery = json.action_point_recovery;
        for (const pool of ret.pools) {
            pool.quantity = json[RESOURCE[pool.resource_type]].quantity;
            pool.capacity = json[RESOURCE[pool.resource_type]].capacity;
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
                this.pools[RESOURCE[type]] = new CharacterResource(RESOURCE[type as string]);
            }
        }
    }
    public restoreFully() {
        this.action_points = this.max_action_points;
        for (const type in RESOURCE) {
            if (isNaN(Number(type))) {
                (this.pools[RESOURCE[type]] as CharacterResource).refillToCapacity();
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
    public toJSON() {
        const ret = {
            'action_points': this.action_points,
            'max_action_points': this.max_action_points,
            'action_point_recovery': this.action_point_recovery,
        };
        for (const pool of this.pools) {
            ret[RESOURCE[pool.resource_type]] = {
                'quantity': pool.quantity,
                'capacity': pool.capacity,
            };
        }
        return ret;
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
