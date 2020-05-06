import * as t from 'io-ts';
import type { ValueOf } from '../util/types';
import type { Action } from './action';
import { CONTROLLER } from './controller/controllers';
import { InertController } from './controller/inertcontroller';
import { PlayerController } from './controller/playercontroller';
import { WanderController } from './controller/wander_controller';
import type { Entity } from './entity';
import type { Event } from './event';

const controller_schema = t.type({
    'type': t.keyof(CONTROLLER),
});
export type ControllerSchema = t.TypeOf<typeof controller_schema>;

export interface Controller<T extends CONTROLLER = CONTROLLER> {
    type: T;
    getNextAction(): Action;
    popAction(): void; // Called if action succeeded, failed, or was redundant (e.g. insufficient AP will not call this)
    newRound(): void;// Called when a new round starts
    sendEvent(event: Event): void;
    toJSON(): ControllerSchema;
    getClientJSON(viewer: Entity): undefined;
}

export interface ControllerClass<T extends CONTROLLER> {
    fromJSON(json: any, entity: Entity): Controller<T>
    new(...args: any): Controller<T>
}

type ControllerClassArray = {
    [P in ValueOf<typeof CONTROLLER>]: ControllerClass<P>;
};

const controller: ControllerClassArray = [
    InertController,
    PlayerController,
    WanderController,
];

export const Controller = {
    'schema': controller_schema,
    'fromJSON': (json: ControllerSchema, entity: Entity): Controller => {
        return controller[CONTROLLER[json.type]].fromJSON(json, entity);
    },
    'getNewController': (type: CONTROLLER, ...args: any) => {
        return new controller[type](...args);
    }
}
