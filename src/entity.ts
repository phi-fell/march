import { CharacterSheet } from './character/charactersheet';
import { AttackEvent } from './clientevent';
import { DIRECTION, directionVectors } from './direction';
import { Instance } from './instance';
import { Location } from './location';
import { Random } from './math/random';

export const MOVE_AP = 5;
export const MAX_VISIBILITY_RADIUS = 22;

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
    private visibility: boolean[][];
    constructor(
        public id: string,
        public name: string,
        public schema_id: string,
        loc: Location,
        public direction: DIRECTION = DIRECTION.UP,
    ) {
        this.charSheet = new CharacterSheet();
        this._location = loc;
        this.lastHitSheet = undefined;
        this.visibility = [];
        for (let i = -MAX_VISIBILITY_RADIUS; i <= MAX_VISIBILITY_RADIUS; i++) {
            this.visibility[i] = [];
            for (let j = -MAX_VISIBILITY_RADIUS; j <= MAX_VISIBILITY_RADIUS; j++) {
                this.visibility[i][j] = false;
            }
        }
        const inst = Instance.getLoadedInstanceById(loc.instance_id);
        if (inst) {
            inst.addMob(this);
        } else {
            console.log('MOB CONSTRUCTED IN INVALID LOCATION STATE! INSTANCE DOES NOT EXIST: ' + loc.instance_id);
        }
    }
    get location(): Location {
        return this._location;
    }
    set location(loc: Location) {
        if (this._location.instance_id !== loc.instance_id) {
            const fromInst = Instance.getLoadedInstanceById(this._location.instance_id);
            const toInst = Instance.getLoadedInstanceById(loc.instance_id);
            if (fromInst) {
                fromInst.removeMob(this);
            } else {
                console.log('Mob moving from nonexistant instance: ' + this._location.instance_id);
            }
            if (toInst) {
                toInst.addMob(this);
            } else {
                console.log('MOB IN INVALID LOCATION STATE! INSTANCE DOES NOT EXIST: ' + loc.instance_id);
            }
        }
        this._location = loc;
    }
    public doNextAction(): ACTION_STATUS {
        if (this.charSheet.hasSufficientAP(MOVE_AP)) {
            const dir = Math.floor(Random.float() * 4) as DIRECTION;
            this.move(dir); // TODO: ensure move succeeded
            this.charSheet.useAP(MOVE_AP);
            return ACTION_STATUS.PERFORMED;
        }
        return ACTION_STATUS.WAITING;
    }
    public hit(attacker: Entity) {
        this.lastHitSheet = attacker.charSheet;
        const inst = Instance.getLoadedInstanceById(this.location.instance_id);
        const event = new AttackEvent(false, attacker, this);
        this.charSheet.takeHit(event);
        if (inst) {
            inst.emit(event, this.location);
        }
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
    protected move(dir: DIRECTION) {
        const to = this.location.getMovedBy(directionVectors[dir].x, directionVectors[dir].y);
        const inst = Instance.getLoadedInstanceById(this.location.instance_id);
        if (!inst) {
            return console.log('CANNOT MOVE() MOB IN NONEXISTENT LOCATION!');
        }
        if (inst.isTilePassable(to.x, to.y)) {
            const mobInWay = inst.getMobInLocation(to.x, to.y);
            if (mobInWay) {
                mobInWay.hit(this);
            } else {
                this.location = to;
            }
        }
    }
    protected handleDeath() {
        // TODO: add ability to attach listeners to entities e.g. death listener, damage listener, etc.
        // TODO: kill entity
        const inst = Instance.getLoadedInstanceById(this.location.instance_id);
        if (inst) {
            inst.dropInventory(this.charSheet.equipment.inventory, this.location);
        } else {
            console.log('Cannot drop items from mob killed in nonexistent location!');
        }
        Instance.removeEntityFromWorld(this);
        if (this.lastHitSheet) {
            this.lastHitSheet.addExperience(this.charSheet.getEssenceWorth());
        }
    }
}
