import * as t from 'io-ts';
import { Random, UUID } from '../math/random';
import type { Cell } from './cell';
import { ComponentName, Components, WithAllCallback, WithCallback } from './component';
import { Locatable, locatable_schema } from './locatable';
import { Location } from './location';

export type EntitySchema = t.TypeOf<typeof Entity.schema>;

export class Entity extends Locatable {
    public static schema = t.intersection([
        t.type({
            'id': t.string,
            'components': Components.schema,
        }),
        locatable_schema,
    ]);

    /**
     * Only call if the resulting entity will be placed into a cell/board by the caller
     * e.g. call this from Board.fromJSON() and probably nowhere else
     */
    public static fromJSON(cell: Cell, json: EntitySchema, emplaced: boolean = false): Entity {
        console.log(json);
        const ret = new Entity(Location.fromJSON(cell, json.location), json.id, emplaced);
        ret.components = Components.fromJSON(json.components);
        return ret;
    }

    private components: Components = {};
    public constructor(loc: Location, public id: UUID = Random.uuid(), emplaced: boolean = false) {
        super(loc, emplaced);
    }
    public isEntity(): this is Entity {
        return true;
    }
    public isCollidable(): boolean {
        // TODO: give entities a component that makes them collide?
        // i.e. delete this function and add some component that handles that
        // (even if the component is just a boolean with an entry in component_wrappers)
        return true;
    }
    public getComponent<T extends ComponentName>(name: T) {
        return this.components[name];
    }
    public getComponents<T extends ComponentName[]>(...names: T) {
        return Components.getComponents(this.components, ...names);
    }
    public setComponent<T extends ComponentName>(name: T, component: Components[T]) {
        this.components[name] = component;
    }
    /**
     * Calls the passed callbacks with the values of the named components (or undefined for components not present)
     * @param callback callback to be called (synchronously)
     * @param names names of components
     */
    public with<T extends ComponentName[]>(callback: WithCallback<T>, ...names: T) {
        return Components.withComponents(this.components, callback, ...names);
    }
    /**
     * If all of the named components are present on this entity:
     *      Calls the passed callbacks with the values of the named components
     * If any of the named components are not present, does nothing
     * @param callback callback to be called (synchronously)
     * @param names names of components
     */
    public withAll<T extends ComponentName[]>(callback: WithAllCallback<T>, ...names: T) {
        return Components.withAllComponents(this.components, callback, ...names);
    }
    public getName(): string {
        const sheet = this.getComponent('sheet');
        if (sheet) {
            return sheet.name;
        }
        const item_data = this.getComponent('item_data');
        if (item_data) {
            return item_data.name;
        }
        return this.id;
    }
    public equals(other: Entity): boolean {
        return this.id === other.id;
    }
    public toJSON(): EntitySchema {
        return {
            'id': this.id,
            'location': this.location.toJSON(),
            'components': Components.toJSON(this.components),
        }
    }
    public getClientJSON() {
        return this.toJSON(); // TODO: reduce info sent
    }
}
