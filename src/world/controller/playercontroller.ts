import type { Action } from '../action';
import { ACTION_TYPE } from '../action/actiontype';
import { AsyncAction } from '../action/async_action';
import type { ControllerClass } from '../controller';
import type { Entity } from '../entity';
import type { Event } from '../event';
import type { AddEntityEvent } from '../event/add_entity_event';
import { EVENT_TYPE } from '../event/event_type';
import type { RemoveEntityEvent } from '../event/remove_entity_event';
import type { Player } from '../player';
import { CONTROLLER } from './controllers';
import { ControllerBase } from './controller_base';

export const PlayerController: ControllerClass<CONTROLLER.PLAYER> = class extends ControllerBase {
    public static fromJSON(json: any, entity: Entity) {
        return new PlayerController(entity);
    }
    type: CONTROLLER.PLAYER = CONTROLLER.PLAYER;
    constructor(private parent: Entity, private player?: Player) { super(); }
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
    public sendEvent(event: Event) {
        if (event.type === EVENT_TYPE.ADD_ENTITY) {
            this.parent.getComponent('visibility_manager')?.addEntity((event as AddEntityEvent).entity)
        } else if (event.type === EVENT_TYPE.REMOVE_ENTITY) {
            this.parent.getComponent('visibility_manager')?.removeEntity((event as RemoveEntityEvent).entity)
        }
        this.player?.sendEvent(event);
    }
}
