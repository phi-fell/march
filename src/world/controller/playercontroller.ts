import { Action, AsyncAction } from '../action';
import { CONTROLLER, Controller } from '../controller';

export class PlayerController extends Controller {
    type: CONTROLLER.PLAYER = CONTROLLER.PLAYER;
    public getNextAction(): Action {
        return new AsyncAction();
    }
}
