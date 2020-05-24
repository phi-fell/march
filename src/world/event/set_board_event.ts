import type { Entity } from '../entity';
import { EVENT_TYPE } from './event_type';

export class SetBoardEvent {
    public type: EVENT_TYPE.SET_BOARD = EVENT_TYPE.SET_BOARD;
    public getClientJSON(viewer: Entity) {
        return {
            'type': EVENT_TYPE[this.type] as keyof typeof EVENT_TYPE,
            'board': viewer.location.cell.getClientJSON(viewer),
        };
    }
}
