import { Action, AsyncAction } from '../action';
import { CONTROLLER } from './controllers';
import { ControllerBase } from './controller_base';

export class PlayerController extends ControllerBase {
    type: CONTROLLER.PLAYER = CONTROLLER.PLAYER;
    public getNextAction(): Action {
        return new AsyncAction();
    }
}
