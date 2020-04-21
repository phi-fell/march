import * as t from 'io-ts';
import type { UUID } from '../math/random';
import { getTileFromName, getTilePalette, NO_TILE, Tile } from '../tile';
import { assertUnreachable } from '../util/assert';
import { ACTION_RESULT } from './action/actionresult';
import type { Cell } from './cell';
import { Entity } from './entity';
import type { Event } from './event';
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

    public static async fromJSON(cell: Cell, json: BoardSchema): Promise<Board> {
        const mapping: number[] = json.palette.map(getTileFromName);
        const t_mapped: Tile[][] = [];
        for (let x = 0; x < json.width; x++) {
            t_mapped[x] = [];
            for (let y = 0; y < json.height; y++) {
                t_mapped[x][y] = mapping[json.tiles[x][y]];
            }
        }
        const ret = new Board(json.width, json.height, t_mapped);
        json.entities.map((ent) => Entity.fromJSON(cell, ent));
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
    public emitGlobal(event: Event) {
        for (const ent of this.entities) {
            if (ent.controller) {
                ent.controller.sendEvent(event);
            }
        }
    }
    public emit(event: Event, ...locations: Location[]) {
        for (const ent of this.entities) {
            if (ent.controller === undefined) {
                continue;
            }
            if (ent.visibility_manager === undefined) {
                ent.controller.sendEvent(event);
                continue;
            }
            for (const loc of locations) {
                if (ent.visibility_manager.canSee(loc)) {
                    ent.controller.sendEvent(event);
                    break;
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
            if (a.sheet && b.sheet) {
                return b.sheet.getInitiative() - a.sheet.getInitiative();
            }
            if (a.sheet) {
                return -1;
            }
            if (b.sheet) {
                return 1;
            }
            return 0;
        });
        for (const ent of this.entities) {
            if (ent.sheet && ent.controller) {
                const action = ent.controller.getNextAction();
                const result = action.perform(ent);
                ent.sheet.useAP(result.cost);
                switch (result.result) {
                    case ACTION_RESULT.ASYNC:
                        this.waitingOnAsyncEntityID = ent.id;
                        return; // waiting on player
                    case ACTION_RESULT.FAILURE:
                        ent.controller.popAction();
                        break;
                    case ACTION_RESULT.INSUFFICIENT_AP:
                        break;
                    case ACTION_RESULT.REDUNDANT:
                        ent.controller.popAction();
                        break;
                    case ACTION_RESULT.SUCCESS:
                        ent.controller.popAction();
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
            if (ent.sheet) {
                ent.sheet.startNewTurn();
            }
            if (ent.controller) {
                ent.controller.newRound();
            }
        }
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
    public getClientEntitiesJSON() {
        return this.entities.map((e) => e.getClientJSON());
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
