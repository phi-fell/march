import type { ValueOf } from '../util/types';
import type { Entity } from './entity';
import { AddEntityEvent } from './event/add_entity_event';
import { AttackEvent } from './event/attack_event';
import { BackstepEvent } from './event/backstep_event';
import { DeathEvent } from './event/death_event';
import { DropEvent } from './event/drop_event';
import { EquipArmorEvent } from './event/equip_armor_event';
import { EquipWeaponEvent } from './event/equip_weapon_event';
import type { EVENT_TYPE } from './event/event_type';
import { LookEvent } from './event/look_event';
import { MessageEvent } from './event/message_event';
import { MoveEvent } from './event/move_event';
import { NewRoundEvent } from './event/new_round_event';
import { PickupEvent } from './event/pickup_event';
import { RemoveEntityEvent } from './event/remove_entity_event';
import { SayEvent } from './event/say_event';
import { SetBoardEvent } from './event/set_board_event';
import { StatusChangeEvent } from './event/status_change_event';
import { StrafeEvent } from './event/strafe_event';
import { TurnEvent } from './event/turn_event';
import { UnequipArmorEvent } from './event/unequip_armor_event';
import { UnequipWeaponEvent } from './event/unequip_weapon_event';
import { UsePortalEvent } from './event/use_portal_event';
import { WaitEvent } from './event/wait_event';
import { WaitOnceEvent } from './event/wait_once_event';
import { WaitRoundEvent } from './event/wait_round_event';

export interface EventClientJSON {
    type: keyof typeof EVENT_TYPE,
}

export interface Event<T extends EVENT_TYPE = EVENT_TYPE> {
    type: T;
    getClientJSON(viewer: Entity): EventClientJSON;
}

export type EventClass<T extends EVENT_TYPE> = new (...args: any) => Event<T>;

type EventClassArray = {
    [P in ValueOf<typeof EVENT_TYPE>]: EventClass<P>;
};

export const EventClasses: EventClassArray = [
    MessageEvent,
    SetBoardEvent,
    NewRoundEvent,
    AddEntityEvent,
    RemoveEntityEvent,
    StatusChangeEvent,
    WaitEvent,
    WaitOnceEvent,
    WaitRoundEvent,
    SayEvent,
    LookEvent,
    MoveEvent,
    StrafeEvent,
    BackstepEvent,
    TurnEvent,
    AttackEvent,
    PickupEvent,
    DropEvent,
    EquipArmorEvent,
    UnequipArmorEvent,
    EquipWeaponEvent,
    UnequipWeaponEvent,
    UsePortalEvent,
    DeathEvent,
];
