import type { Action } from '../action';
import { ACTION_TYPE } from '../action/actiontype';
import { AsyncAction } from '../action/async_action';
import type { Entity } from '../entity';
import type { Event } from '../event';
import type { AddEntityEvent } from '../event/add_entity_event';
import { EVENT_TYPE } from '../event/event_type';
import type { RemoveEntityEvent } from '../event/remove_entity_event';
import { CONTROLLER } from './controllers';
import { ControllerBase } from './controller_base';

export class PlayerController extends ControllerBase {
    public static fromJSON(json: any, entity: Entity) {
        return new PlayerController(entity);
    }
    type: CONTROLLER.PLAYER = CONTROLLER.PLAYER;
    constructor(private parent: Entity) { super(); }
    public getNextAction(): Action {
        const player = this.parent.getComponent('player');
        if (player !== undefined) {
            const action = player.getNextAction();
            if (action !== undefined) {
                if (action.type === ACTION_TYPE.WAIT_ONCE) {
                    this.popAction();
                }
                return action;
            }
        }
        return new AsyncAction();
    }
    public popAction() {
        const player = this.parent.getComponent('player');
        if (player !== undefined) {
            player.popAction();
        }
    }
    public newRound() {
        const player = this.parent.getComponent('player');
        if (player !== undefined) {
            const action = player.getNextAction();
            if (action && action.type === ACTION_TYPE.WAIT_ROUND) {
                this.popAction();
            }
        }
    }
    public sendEvent(event: Event) {
        if (event.type === EVENT_TYPE.ADD_ENTITY) {
            this.parent.getComponent('visibility_manager')?.addEntity((event as AddEntityEvent).entity)
        } else if (event.type === EVENT_TYPE.REMOVE_ENTITY) {
            this.parent.getComponent('visibility_manager')?.removeEntity((event as RemoveEntityEvent).entity)
        }
        this.parent.getComponent('player')?.sendEvent(event);
    }
}
