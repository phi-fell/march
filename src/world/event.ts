import type { ValueOf } from '../util/types';
import type { EVENT_TYPE } from './event/event_type';
import { NewRoundEvent } from './event/new_round_event';

interface EventClientJSON {
    type: keyof typeof EVENT_TYPE,
    message: string,
}

export interface Event<T extends EVENT_TYPE = EVENT_TYPE> {
    type: T;
    resendBoard: boolean;
    getClientJSON(): EventClientJSON;
}

export type EventClass<T extends EVENT_TYPE> = new (...args: any) => Event<T>;

type EventClassArray = {
    [P in ValueOf<typeof EVENT_TYPE>]: EventClass<P>;
};

export const EventClasses: EventClassArray = [
    NewRoundEvent,
];
