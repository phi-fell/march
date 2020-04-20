import * as t from 'io-ts';
import type { Action } from './action';
import { CONTROLLER } from './controller/controllers';
import { InertController } from './controller/inertcontroller';
import { PlayerController } from './controller/playercontroller';

const controller_schema = t.keyof(CONTROLLER);
export type ControllerSchema = t.TypeOf<typeof controller_schema>;

export interface Controller {
    type: CONTROLLER;
    getNextAction(): Action;
    popAction(): void; // Called if action succeeded, failed, or was redundant (e.g. insufficient AP will not call this)
    newRound(): void;// Called when a new round starts
    toJSON(): ControllerSchema;
}

const controller: Record<CONTROLLER, new (...args: any) => Controller> = [
    InertController,
    PlayerController
];

export const Controller = {
    'schema': controller_schema,
    'fromJSON': (json: ControllerSchema): Controller => {
        return new controller[CONTROLLER[json]]();
    }
}
