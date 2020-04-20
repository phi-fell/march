import type { Action } from '../action';
import { ACTION_TYPE } from '../action/actiontype';
import { AsyncAction } from '../action/async_action';
import type { ControllerClass } from '../controller';
import type { Player } from '../player';
import { CONTROLLER } from './controllers';
import { ControllerBase } from './controller_base';

export const PlayerController: ControllerClass<CONTROLLER.PLAYER> = class extends ControllerBase {
    public static fromJSON(json: any) {
        return new PlayerController();
    }
    type: CONTROLLER.PLAYER = CONTROLLER.PLAYER;
    constructor(private player?: Player) { super(); }
    public getNextAction(): Action {
        if (this.player === undefined) {
            return new AsyncAction();
        }
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
        if (this.player === undefined) {
            return;
        }
        this.player.popAction();
    }
    public newRound() {
        if (this.player === undefined) {
            return;
        }
        const action = this.player.getNextAction();
        if (action && action.type === ACTION_TYPE.WAIT_ROUND) {
            this.popAction();
        }
    }
}
