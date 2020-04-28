import { Random } from '../../math/random';
import type { Action } from '../action';
import { MoveAction } from '../action/move_action';
import { TurnAction } from '../action/turn_action';
import type { ControllerClass } from '../controller';
import type { DIRECTION } from '../direction';
import { CONTROLLER } from './controllers';
import { ControllerBase } from './controller_base';

export const WanderController: ControllerClass<CONTROLLER.WANDER> = class extends ControllerBase {
    public static fromJSON(json: any) {
        return new WanderController();
    }
    private state: 0 | 1 = 1;
    private dir: DIRECTION = 0;
    type: CONTROLLER.WANDER = CONTROLLER.WANDER;
    public getNextAction(): Action {
        switch (this.state) {
            case 0:
                return new MoveAction(this.dir);
            case 1:
                this.dir = Random.int(0, 4);
                this.state = 0;
                return new TurnAction(this.dir);
        }
    }
}
