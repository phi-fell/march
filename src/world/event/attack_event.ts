import type { Damage } from '../../damage';
import { DIRECTION } from '../direction';
import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class AttackEvent {
    public type: EVENT_TYPE.ATTACK = EVENT_TYPE.ATTACK;
    constructor(
        public attacker: Entity,
        public direction: DIRECTION,
        public defender: Entity | undefined,
        public success: boolean = false,
        public damage: Damage[] = [],
    ) { }
    public getClientJSON(viewer: Entity) {
        let msg = `${this.attacker.getComponent('name')} `;
        if (this.defender !== undefined) {
            msg += `attacks ${this.defender.getComponent('name')}`;
        } else {
            msg += `swings their weapon at nothing`;
        }
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'entity_id': this.attacker.id,
            'direction': DIRECTION[this.direction],
            'message': msg,
        };
    }
}
