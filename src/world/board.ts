import * as t from 'io-ts';
import type { UUID } from '../math/random';
import { getTileFromName, getTilePalette, NO_TILE, Tile } from '../tile';
import { assertUnreachable } from '../util/assert';
import { ACTION_RESULT } from './action/actionresult';
import type { Cell } from './cell';
import { Entity } from './entity';
import type { Event } from './event';
import { NewRoundEvent } from './event/new_round_event';
import type { Location } from './location';

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
                    return;
                }
                for (const loc of locations) {
                    if (visibility_manager.canSee(loc)) {
                        ent.getComponent('controller').sendEvent(event);
                        break;
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
    public doNextTurn() {
        if (this.waitingOnAsyncEntityID !== undefined) {
            return;
        }
        this.entities.sort((a: Entity, b: Entity) => {
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
        });
        for (const ent of this.entities) {
            const [sheet, controller] = ent.getComponents('sheet', 'controller');
            if (sheet !== undefined && controller !== undefined) {
                const action = controller.getNextAction();
                const result = action.perform(ent);
                sheet.useAP(result.cost);
                switch (result.result) {
                    case ACTION_RESULT.ASYNC:
                        this.waitingOnAsyncEntityID = ent.id;
                        return; // waiting on player
                    case ACTION_RESULT.FAILURE:
                        controller.popAction();
                        break; // TODO: should be return; if there is another way to guarantee stalemates will be avoided
                    case ACTION_RESULT.INSUFFICIENT_AP:
                        break;
                    case ACTION_RESULT.REDUNDANT:
                        controller.popAction();
                        return;
                    case ACTION_RESULT.SUCCESS:
                        controller.popAction();
                        return;
                    default:
                        assertUnreachable(result.result);
                }
            }
        }
        this.startNextRound();
    }
    public startNextRound() {
        for (const ent of this.entities) {
            if (ent.has('sheet')) {
                ent.getComponent('sheet').startNewTurn();
            }
            if (ent.has('controller')) {
                ent.getComponent('controller').newRound();
            }
        }
        this.emitGlobal(new NewRoundEvent());
    }
    public getEntity(id: UUID): Entity {
        const ret = this.entities.find((ent) => ent.id === id);
        if (ret) {
            return ret;
        }
        throw new Error(`No such entity in board as {id:${id}}!`)
    }
    public addEntity(ent: Entity) {
        this.entities.push(ent);
    }
    public removeEntity(ent: Entity) {
        const i = this.entities.findIndex((e) => e.equals(ent));
        if (i === -1) {
            console.log('Cannot remove nonexistent entity from Board!');
        }
        this.entities.splice(i, 1);
    }
    public getClientEntitiesJSON(viewer: Entity) {
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
