import * as t from 'io-ts';
import type { UUID } from '../math/random';
import { getTileFromName, getTilePalette, NO_TILE, Tile } from '../tile';
import { ACTION_RESULT } from './action/actionresult';
import type { Cell } from './cell';
import { Entity } from './entity';
import type { Event } from './event';
import { MessageEvent } from './event/message_event';
import { NewRoundEvent } from './event/new_round_event';
import { StatusChangeEvent } from './event/status_change_event';
import type { Location } from './location';

function findInsertionPos(array: Entity[], min: number, max: number, initiative: number): number {
    if (min === max) {
        return min;
    }
    const mid = Math.floor((min + max) / 2);
    const ent = array[mid];
    const sheet = ent.getComponent('sheet');
    if (sheet === undefined) {
        return findInsertionPos(array, min, mid, initiative);
    }
    if (sheet.getInitiative() < initiative) {
        return findInsertionPos(array, min, mid, initiative);
    }
    return findInsertionPos(array, mid + 1, max, initiative)
}

const initiative_compare_function = (a: Entity, b: Entity) => {
    const a_sheet = a.getComponent('sheet');
    const b_sheet = b.getComponent('sheet');
    if (a_sheet && b_sheet) {
        return b_sheet.getInitiative() - a_sheet.getInitiative();
    }
    if (a_sheet) {
        return -1;
    }
    if (b_sheet) {
        return 1;
    }
    return 0;
};

export type BoardSchema = t.TypeOf<typeof Board.schema>

export class Board {
    public static schema = t.type({
        'width': t.number,
        'height': t.number,
        'tiles': t.array(t.array(t.number)),
        'entities': t.array(Entity.schema),
        'palette': t.array(t.string),
    });

    public static fromJSON(cell: Cell, json: BoardSchema): Board {
        const mapping: number[] = json.palette.map(getTileFromName);
        const t_mapped: Tile[][] = [];
        for (let x = 0; x < json.width; x++) {
            t_mapped[x] = [];
            for (let y = 0; y < json.height; y++) {
                t_mapped[x][y] = mapping[json.tiles[x][y]];
            }
        }
        const ret = new Board(json.width, json.height, t_mapped);
        ret.entities = json.entities.map((ent) => Entity.fromJSON(cell, ent, true));
        return ret;
    }

    public tiles: Tile[][] = [];
    private waitingOnAsyncEntityID: UUID | undefined;
    private entities: Entity[] = [];
    /*
        TODO: ? could be worthwhile to split entities into a map by ID and an array by position, and duplicate data
        (since reads are likely more common than entity movements (and some ents are items or whatnot which do not move))
        I'll wait on this and not prematurely optimize,
        especially without profiling to ensure this is even an area that's executed enough to be worthwhile
    */
    constructor(public width: number, public height: number, t_in?: Tile[][]) {
        if (t_in === undefined) {
            for (let x = 0; x < width; x++) {
                this.tiles[x] = [];
                for (let y = 0; y < height; y++) {
                    this.tiles[x][y] = NO_TILE;
                }
            }
        } else {
            for (let x = 0; x < width; x++) {
                this.tiles[x] = [];
                for (let y = 0; y < height; y++) {
                    this.tiles[x][y] = t_in[x][y];
                }
            }
        }
    }
    public getAllEntities() {
        return this.entities;
    }
    public getEntitiesAt(x: number, y: number): Entity[] {
        return this.entities.filter((e) => { return e.location.x === x && e.location.y === y });
    }
    public emitGlobal(event: Event) {
        for (const ent of this.entities) {
            if (ent.isMob()) {
                ent.getComponent('controller').sendEvent(event);
            }
        }
    }
    public emit(event: Event, ...locations: Location[]) {
        for (const ent of this.entities) {
            if (ent.isMob()) {
                const visibility_manager = ent.getComponent('visibility_manager');
                if (visibility_manager === undefined) {
                    ent.getComponent('controller').sendEvent(event);
                } else {
                    const visible = visibility_manager.getVisibilityMap();
                    for (const loc of locations) {
                        if (visible[loc.x][loc.y]) {
                            ent.getComponent('controller').sendEvent(event);
                            break;
                        }
                    }
                }
            }
        }
    }
    /**
     * emits event to entities only if at least 1 of the locs in whitelist is visible and NONE of the locs in blacklist are visible
     * @param event event to possibly emit
     * @param whitelist list of locations, at least 1 of which must be visible for an entity to recieve the event
     * @param blacklist list of locations, all of which must NOT be visible for an entity to recieve the event
     */
    public emitWB(event: Event, whitelist: Location[], blacklist: Location[]) {
        for (const ent of this.entities) {
            const visibility_manager = ent.getComponent('visibility_manager');
            if (visibility_manager !== undefined && ent.isMob()) {
                const visible = visibility_manager.getVisibilityMap();
                let w = false;
                let b = false;
                for (const loc of whitelist) {
                    if (visible[loc.x][loc.y]) {
                        w = true;
                        break;
                    }
                }
                if (w) {
                    for (const loc of blacklist) {
                        if (visible[loc.x][loc.y]) {
                            b = true;
                        }
                    }
                    if (!b) {
                        ent.getComponent('controller').sendEvent(event);
                    }
                }
            }
        }
    }
    public notifyAsyncEnt(entity_id: UUID) {
        if (this.waitingOnAsyncEntityID === entity_id) {
            this.waitingOnAsyncEntityID = undefined;
        }
    }
    public async doNextTurn() {
        if (this.waitingOnAsyncEntityID !== undefined) {
            return;
        }
        // DEBUG to catch any sorting issues
        /*const sorted = this.entities.reduce((acc, cur, index, arr) => {
            if (!acc || index === arr.length - 1) {
                return acc
            }
            const a_sheet = cur.getComponent('sheet');
            const b_sheet = arr[index + 1].getComponent('sheet');
            if (a_sheet && b_sheet) {
                return b_sheet.getInitiative() <= a_sheet.getInitiative();
            }
            if (a_sheet) {
                return true;
            }
            if (b_sheet) {
                return false;
            }
            return true;
        }, true);
        if (!sorted) {
            console.log('NOT SORTED!!!');
            console.log('[' + this.entities.map((e) => {
                const sheet = e.getComponent('sheet');
                if (sheet === undefined) {
                    return 'n/a';
                }
                return sheet.getInitiative();
            }).join(', ') + ']');
        }*/
        for (const ent of this.entities) {
            if (await this.tryNextAction(ent)) {
                return;
            }
        }
        this.startNextRound();
    }
    private async tryNextAction(entity: Entity, max_attempts: number = 10): Promise<boolean> {
        const [sheet, controller] = entity.getComponents('sheet', 'controller');
        if (sheet === undefined || controller === undefined) {
            return false;
        }
        const action = controller.getNextAction();
        const result = await action.perform(entity);
        switch (result.result) {
            case ACTION_RESULT.ASYNC:
                this.waitingOnAsyncEntityID = entity.id;
                return true; // waiting on player
            case ACTION_RESULT.INSUFFICIENT_AP:
                return false;
            case ACTION_RESULT.FAILURE:
            case ACTION_RESULT.REDUNDANT:
                controller.popAction();
                if (max_attempts > 1) {
                    return this.tryNextAction(entity, max_attempts - 1);
                }
                if (!entity.isActivePlayer()) {
                    console.log('Non-Player action attempts exceeded. AP deducted and turn skipped.  Fix enemy AI');
                } else {
                    console.log('Player Action attempts exceeded. AP deducted and turn skipped. Player notified.');
                    controller.sendEvent(new MessageEvent('Too many redundant or failed actions in a row! AP deducted.'));
                }
                sheet.useAP(10);
                entity.refreshPlaceInTurnOrder();
                return true;
            case ACTION_RESULT.SUCCESS:
                sheet.useAP(result.cost);
                if (result.cost > 0) {
                    entity.refreshPlaceInTurnOrder();
                    if (entity.isMob()) {
                        controller.sendEvent(new StatusChangeEvent(entity));
                    }
                }
                controller.popAction();
                return true;
        }
    }
    public startNextRound() {
        for (const ent of this.entities) {
            if (ent.has('sheet')) {
                ent.getComponent('sheet').startNewTurn();
            }
            if (ent.has('controller')) {
                ent.getComponent('controller').newRound();
                if (ent.isMob()) {
                    ent.getComponent('controller').sendEvent(new StatusChangeEvent(ent));
                }
            }
        }
        this.emitGlobal(new NewRoundEvent());
        this.entities.sort(initiative_compare_function);
    }
    public refreshEntityPlaceInTurnOrder(entity: Entity) {
        if (this.removeEntity(entity)) {
            this.addEntity(entity);
        } else {
            console.log('BUG! refreshEntityPlaceInTurnOrder somehow called on a board that does not contain the entity!!!');
        }
    }
    public getEntity(id: UUID): Entity {
        const ret = this.entities.find((ent) => ent.id === id);
        if (ret) {
            return ret;
        }
        throw new Error(`No such entity in board as {id:${id}}!`)
    }
    public addEntity(ent: Entity, constructed: boolean = true) {
        if (!constructed || !ent.has('sheet')) {
            this.entities.push(ent);
            return;
        }
        const initiative = ent.getComponent('sheet').getInitiative();
        const index = findInsertionPos(this.entities, 0, this.entities.length, initiative);
        if (index === this.entities.length) {
            this.entities.push(ent);
        } else {
            this.entities.splice(index, 0, ent);
        }
    }
    public removeEntity(ent: Entity): boolean {
        const i = this.entities.findIndex((e) => e.equals(ent));
        if (i === -1) {
            console.log('Cannot remove nonexistent entity from Board!');
            return false;
        }
        if (this.waitingOnAsyncEntityID === ent.id) {
            this.waitingOnAsyncEntityID = undefined;
        }
        this.entities.splice(i, 1);
        return true;
    }
    public getClientEntitiesJSON(viewer: Entity) {
        const visibility_manager = viewer.getComponent('visibility_manager');
        if (visibility_manager !== undefined) {
            return visibility_manager.getVisibleEntities().map((e) => e.getClientJSON(viewer));
        }
        return this.entities.map((e) => e.getClientJSON(viewer));
    }
    public toJSON(): BoardSchema {
        return {
            'width': this.width,
            'height': this.height,
            'tiles': this.tiles,
            'entities': this.entities.map((ent) => ent.toJSON()),
            'palette': getTilePalette(),
        }
    }
}
