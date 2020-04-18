import type { Action } from '../action';
import type { Controller, ControllerSchema } from '../controller';
import { CONTROLLER } from './controllers';

export abstract class ControllerBase implements Controller {
    public abstract type: CONTROLLER;
    public abstract getNextAction(): Action;
    public toJSON(): ControllerSchema {
        return CONTROLLER[this.type] as keyof typeof CONTROLLER;
    }
}
