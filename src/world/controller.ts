import * as t from 'io-ts';
import type { Action } from './action';

export enum CONTROLLER {
    INERT,
    PLAYER,
}

export type ControllerSchema = t.TypeOf<typeof Controller.schema>;

export abstract class Controller {
    public static schema = t.keyof(CONTROLLER);

    private static controllers: ((new () => Controller) | undefined)[] = [];
    public static registerController(type: CONTROLLER, controller: new () => Controller) {
        Controller.controllers[type] = controller;
    }

    public static fromJSON(json: ControllerSchema): Controller {
        const controller_class = Controller.controllers[CONTROLLER[json]];
        if (controller_class === undefined) {
            throw new Error(`No registered controller found as ${json}!`);
        }
        return new controller_class();
    }

    abstract type: CONTROLLER;
    abstract getNextAction(): Action;

    public toJSON(): ControllerSchema {
        return CONTROLLER[this.type] as keyof typeof CONTROLLER;
    }
}
