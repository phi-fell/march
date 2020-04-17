import { Action, WaitAction } from '../action';
import { Controller, CONTROLLER } from '../controller';

export class InertController extends Controller {
    type: CONTROLLER.INERT = CONTROLLER.INERT;
    public getNextAction(): Action {
        return new WaitAction();
    }
}

Controller.registerController(CONTROLLER.INERT, InertController);
