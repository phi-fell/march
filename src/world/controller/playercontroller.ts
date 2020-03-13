import { Action, AsyncAction } from '../action';
import { Controller } from '../controller';

export class PlayerController implements Controller {
    public getNextAction(): Action {
        return new AsyncAction();
    }

}
