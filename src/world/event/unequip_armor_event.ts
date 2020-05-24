import type { Armor } from '../../item/armor';
import type { Entity, Mob } from '../entity';
import { EVENT_TYPE } from './event_type';

export class UnequipArmorEvent {
    public type: EVENT_TYPE.UNEQUIP_ARMOR = EVENT_TYPE.UNEQUIP_ARMOR;
    constructor(private entity: Mob, private armor: Armor) { }
    public getClientJSON(viewer: Entity) {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'entity_id': this.entity.id,
            'item': this.armor.getClientJSON(viewer),
            'equipment': this.entity.getComponent('sheet').equipment,
            'inventory': this.entity.getComponent('inventory').getClientJSON(viewer),
        };
    }
}
