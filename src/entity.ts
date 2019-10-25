import { CharacterSheet } from './character/charactersheet';
import { DIRECTION } from './direction';
import { Instance } from './instance';
import { Location } from './location';
import { Random } from './math/random';

export const MOVE_AP = 6;

export enum ACTION_STATUS {
    PERFORMED,
    WAITING,
    ASYNC,
}

export class Entity {
    public static generateNewEntityID() {
        return Random.uuid();
    }
    public charSheet: CharacterSheet;
    protected _location: Location;
    private lastHitSheet: CharacterSheet | undefined;
    constructor(
        public id: string,
        public name: string,
        public schema_id = '',
        loc = new Location(0, 0, ''),
        public direction: DIRECTION = DIRECTION.UP,
    ) {
        this.charSheet = new CharacterSheet();
        this._location = new Location(0, 0, '');
        this.lastHitSheet = undefined;
        this.location = loc;
    }
    get location(): Location {
        return this._location;
    }
    set location(loc: Location) {
        if (this.location.instance_id !== loc.instance_id) {
            const fromInst = Instance.instances[this.location.instance_id];
            const toInst = Instance.instances[loc.instance_id];
            if (fromInst) {
                fromInst.removeMob(this);
            }
            if (toInst) {
                toInst.addMob(this);
            }
        }
        this._location = loc;
    }
    public doNextAction(): ACTION_STATUS {
        if (this.charSheet.hasSufficientAP(MOVE_AP)) {
            const dirs = [
                { 'x': 0, 'y': -1 },
                { 'x': 0, 'y': 1 },
                { 'x': -1, 'y': 0 },
                { 'x': 1, 'y': 0 },
            ];
            const dir = dirs[Math.floor(Random.float() * 4)];
            const newLoc = this.location.getMovedBy(dir.x, dir.y);
            this.move(newLoc); // TODO: ensure move succeeded
            this.charSheet.useAP(MOVE_AP);
            return ACTION_STATUS.PERFORMED;
        }
        return ACTION_STATUS.WAITING;
    }
    public hit(charsheet: CharacterSheet) {
        if (charsheet) {
            this.lastHitSheet = charsheet;
        }
        this.charSheet.takeHit(charsheet, null);
        if (this.charSheet.isDead()) {
            this.handleDeath();
        }
    }
    public startNewTurn() {
        if (this.charSheet.isDead()) {
            this.handleDeath();
            return;
        }
        this.charSheet.startNewTurn();
    }
    protected move(to: Location) {
        const fromInst = Instance.instances[this.location.instance_id];
        const toInst = Instance.instances[to.instance_id];
        if (toInst.isTilePassable(to.x, to.y)) {
            const mobInWay = toInst.getMobInLocation(to.x, to.y);
            if (mobInWay) {
                mobInWay.hit(this.charSheet); // TODO: give all mobs a charsheet??? or a placeholder for EXP calculations?
            } else {
                this.location = to.clone();
            }
            if (fromInst.id !== toInst.id) {
                // TODO: instead of sending whole board, send action info so that we can update exactly when necessary
                toInst.updateAllPlayers(); // TODO: is this necessary?  reasoning: players in fromInst WILL be updated at end of update cycle,  toInst could hypothetically not be updated until next update cycle.  (but update cycles should be multiple time per second, so is this necessary?)
            }
        }
    }
    protected handleDeath() {
        // TODO: add ability to attach listeners to entities e.g. death listener, damage listener, etc.
        // TODO: kill entity
        Instance.removeEntityFromWorld(this);
        if (this.lastHitSheet) {
            this.lastHitSheet.addExperience(1); // TODO: make amount variable
        }
    }
}
