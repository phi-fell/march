import type { Entity, PortalEntity } from '../entity';
import { EndLoadEvent } from '../event/end_load';
import { MessageEvent } from '../event/message_event';
import { SetBoardEvent } from '../event/set_board_event';
import { StartLoadEvent } from '../event/start_load_event';
import { UsePortalEvent } from '../event/use_portal_event';
import { ActionBase } from './actionbase';
import { ACTION_RESULT } from './actionresult';
import { ACTION_TYPE } from './actiontype';

export class UsePortalAction extends ActionBase {
    public static fromArgs(args: string[]) {
        return new UsePortalAction(args[0]);
    }
    public type: ACTION_TYPE.USE_PORTAL = ACTION_TYPE.USE_PORTAL;
    public readonly cost: number = 10;
    constructor(public portal_id: string | undefined) {
        super();
    }
    public async perform(entity: Entity) {
        if (!entity.isMob()) {
            return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
        }
        const ents = entity.location.getEntitiesAt().filter((ent) => ent.isPortal()) as PortalEntity[];
        let portal_ent: PortalEntity;
        if (this.portal_id !== undefined) {
            const p = ents.find((ent) => ent.id === this.portal_id);
            if (p === undefined) {
                entity.getComponent('controller').sendEvent(new MessageEvent('No such portal!'));
                return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
            }
            portal_ent = p;
        } else {
            if (ents.length === 0) {
                entity.getComponent('controller').sendEvent(new MessageEvent('No portals here!'));
                return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
            }
            if (ents.length > 1) {
                entity.getComponent('controller').sendEvent(new MessageEvent('More than one portal here!'));
                console.log('ERROR! Multiple portals in 1 location!');
                return { 'result': ACTION_RESULT.FAILURE, 'cost': 0 };
            }
            portal_ent = ents[0];
        }
        if (entity.getComponent('sheet').hasSufficientAP(this.cost)) {
            const portal = portal_ent.getComponent('portal');
            entity.location.cell.emit(new UsePortalEvent(entity), entity.location);
            try {
                entity.getComponent('controller').sendEvent(new StartLoadEvent());
                entity.setLocation(await portal.getDestination(entity.location.cell.instance.world))
                entity.getComponent('controller').sendEvent(new SetBoardEvent());
                entity.getComponent('visibility_manager')?.recalculateAllVisibleEntities();
            } catch (err) {
                const msg = 'BUG: An error occured while generating the area.  This is almost certainly an issue with the cell blueprint.';
                console.log(msg);
                console.log(err);
                entity.getComponent('controller').sendEvent(new MessageEvent(msg));
            } finally {
                entity.getComponent('controller').sendEvent(new EndLoadEvent());
            }
            return { 'result': ACTION_RESULT.SUCCESS, 'cost': this.cost };
        }
        return { 'result': ACTION_RESULT.INSUFFICIENT_AP, 'cost': 0 }
    }
    public toJSON(): object {
        return {
            'type': ACTION_TYPE[this.type],
            'portal_id': this.portal_id,
        };
    }
}
