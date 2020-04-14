import type { Action } from './action';
import * as t from 'io-ts';
import { PlayerController } from './controller/playercontroller';
import { InertController } from './controller/inertcontroller';

export enum CONTROLLER {
    INERT,
    PLAYER,
}

export type ControllerSchema = t.TypeOf<typeof Controller.schema>;

export abstract class Controller {
    public static schema = t.keyof(CONTROLLER);

    public static fromJSON(json: ControllerSchema): Controller {
        switch (CONTROLLER[json]) {
            case CONTROLLER.INERT:
                return new InertController();
            case CONTROLLER.PLAYER:
                return new PlayerController();
        }
    }

    abstract type: CONTROLLER;
    abstract getNextAction(): Action;

    public toJSON(): ControllerSchema {
        return CONTROLLER[this.type] as keyof typeof CONTROLLER;
    }
}
