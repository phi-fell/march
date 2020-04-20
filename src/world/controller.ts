import * as t from 'io-ts';
import type { Action } from './action';
import { CONTROLLER } from './controller/controllers';
import { InertController } from './controller/inertcontroller';
import { PlayerController } from './controller/playercontroller';

const controller_schema = t.type({
    'type': t.keyof(CONTROLLER),
});
export type ControllerSchema = t.TypeOf<typeof controller_schema>;

export interface Controller<T extends CONTROLLER = CONTROLLER> {
    type: T;
    getNextAction(): Action;
    popAction(): void; // Called if action succeeded, failed, or was redundant (e.g. insufficient AP will not call this)
    newRound(): void;// Called when a new round starts
    toJSON(): ControllerSchema;
}

export interface ControllerClass<T extends CONTROLLER> {
    fromJSON(json: any): Controller<T>
    new(...args: any): Controller<T>
}

type ControllerClassArray = {
    [P in typeof CONTROLLER[keyof typeof CONTROLLER]]: ControllerClass<P>;
};

const controller: ControllerClassArray = [
    InertController,
    PlayerController,
];

export const Controller = {
    'schema': controller_schema,
    'fromJSON': (json: ControllerSchema): Controller => {
        return controller[CONTROLLER[json.type]].fromJSON(json);
    }
}
