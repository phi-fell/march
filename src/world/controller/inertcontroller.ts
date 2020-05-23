import type { Action } from '../action';
import { WaitAction } from '../action/wait_action';
import { CONTROLLER } from './controllers';
import { ControllerBase } from './controller_base';

export class InertController extends ControllerBase {
    public static fromJSON(json: any) {
        return new InertController();
    }
    type: CONTROLLER.INERT = CONTROLLER.INERT;
    public getNextAction(): Action {
        return new WaitAction();
    }
}
