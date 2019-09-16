import { CharacterResource, RESOURCE } from './characterresource';

export class CharacterStatus {
    public pools: CharacterResource[] = [];
    public action_points: number = 0;
    public max_action_points: number = 60;
    public action_point_recovery: number = 25;
    constructor() {
        for (const type in RESOURCE) {
            if (isNaN(Number(type))) {
                this.pools[RESOURCE[type]] = new CharacterResource(RESOURCE[type as string]);
            }
        }
    }
    public startNewTurn() {
        this.action_points += this.action_point_recovery;
        if (this.action_points > this.max_action_points) {
            this.action_points = this.max_action_points;
        }
        if (this.pools[RESOURCE.FLESH].quantity < 0) {
            this.pools[RESOURCE.BLOOD].quantity += this.pools[RESOURCE.FLESH].quantity;
        }
        // TODO: recover pools?
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
}