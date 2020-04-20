import type { Action } from '../action';
import { WaitAction } from '../action/wait_action';
import type { ControllerClass } from '../controller';
import { CONTROLLER } from './controllers';
import { ControllerBase } from './controller_base';

export const InertController: ControllerClass<CONTROLLER.INERT> = class extends ControllerBase {
    public static fromJSON(json: any) {
        return new InertController();
    }
    type: CONTROLLER.INERT = CONTROLLER.INERT;
    public getNextAction(): Action {
        return new WaitAction();
    }
}
