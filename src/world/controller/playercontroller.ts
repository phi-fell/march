import type { Action } from '../action';
import { AsyncAction } from '../action/async_action';
import { CONTROLLER } from './controllers';
import { ControllerBase } from './controller_base';

export class PlayerController extends ControllerBase {
    type: CONTROLLER.PLAYER = CONTROLLER.PLAYER;
    public getNextAction(): Action {
        return new AsyncAction();
    }
}
