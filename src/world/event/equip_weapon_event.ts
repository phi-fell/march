import type { Weapon } from '../../item/weapon';
import type { Entity, Mob } from '../entity';
import { EVENT_TYPE } from './event_type';

export class EquipWeaponEvent {
    public type: EVENT_TYPE.EQUIP_WEAPON = EVENT_TYPE.EQUIP_WEAPON;
    constructor(private entity: Mob, private weapon: Weapon) { }
    public getClientJSON(viewer: Entity) {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'entity_id': this.entity.id,
            'item': this.weapon.getClientJSON(viewer),
            'equipment': this.entity.getComponent('sheet').equipment,
            'inventory': this.entity.getComponent('inventory').getClientJSON(viewer),
        };
    }
}
