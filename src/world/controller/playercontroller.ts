import type { Action } from '../action';
import { ACTION_TYPE } from '../action/actiontype';
import { AsyncAction } from '../action/async_action';
import type { Player } from '../player';
import { CONTROLLER } from './controllers';
import { ControllerBase } from './controller_base';

export class PlayerController extends ControllerBase {
    type: CONTROLLER.PLAYER = CONTROLLER.PLAYER;
    constructor(private player: Player) { super() }
    public getNextAction(): Action {
        const action = this.player.getNextAction();
        if (action === undefined) {
            return new AsyncAction();
        }
        if (action.type === ACTION_TYPE.WAIT_ONCE) {
            this.popAction();
        }
        return action;
    }
    public popAction() {
        this.player.popAction();
    }
    public newRound() {
        const action = this.player.getNextAction();
        if (action && action.type === ACTION_TYPE.WAIT_ROUND) {
            this.popAction();
        }
    }
}
