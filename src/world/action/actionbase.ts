import type { Entity } from '../entity';
import type { World } from '../world';
import { ACTION_TYPE } from './actiontype';

export abstract class ActionBase {
    public abstract type: ACTION_TYPE;
    constructor(protected world: World, protected entity: Entity) { }
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}
