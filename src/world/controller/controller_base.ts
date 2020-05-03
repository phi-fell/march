import type { Action } from '../action';
import type { Controller, ControllerSchema } from '../controller';
import type { Entity } from '../entity';
import type { Event } from '../event';
import { CONTROLLER } from './controllers';

export abstract class ControllerBase implements Controller {
    public abstract type: CONTROLLER;
    public abstract getNextAction(): Action;
    public popAction() {
        // only needed if controller has state
    }
    public newRound() {
        // only needed if controller accounts for rounds
    }
    public sendEvent(event: Event) {
        // only needed if controler accounts for events
    }
    public toJSON(): ControllerSchema {
        return { 'type': CONTROLLER[this.type] as keyof typeof CONTROLLER };
    }
    public getClientJSON(viewer: Entity): undefined { return; }
}
