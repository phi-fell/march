import * as t from 'io-ts';
import { Random, UUID } from '../math/random';
import type { ValueOfArray } from '../util/types';
import type { Cell } from './cell';
import { ComponentName, Components, ComponentsWith, ComponentsWithNames, WithAllCallback, WithCallback } from './component';
import { Locatable, locatable_schema } from './locatable';
import { Location } from './location';

export interface EntityWith<T extends ComponentName> extends Entity {
    getComponent<U extends ComponentName>(name: U): ComponentsWith<T>[U];
    getComponents<U extends ComponentName[]>(...names: U): ComponentsWithNames<U, ComponentsWith<T>>;
}

const mob_components = ['sheet', 'controller', 'sprite', 'name'] as const;
type MobComponents = ValueOfArray<typeof mob_components>;
export type Mob = EntityWith<MobComponents>;

const item_components = ['item_data', 'sprite', 'name'] as const;
type ItemComponents = ValueOfArray<typeof item_components>;
export type Item = EntityWith<ItemComponents>;

export type EntitySchema = t.TypeOf<typeof Entity.schema>;

export class Entity extends Locatable {
    public static schema = t.intersection([
        t.type({
            'id': t.string,
            'components': Components.schema,
        }),
        locatable_schema,
    ]);

    public static fromJSON(cell: Cell, json: EntitySchema, emplaced: boolean = false): Entity {
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
    public has<T extends ComponentName[]>(...args: T): this is EntityWith<ValueOfArray<T>> {
        return Components.hasComponents(this.components, ...args);
    }
    public isMob(): this is Mob {
        return this.has(...mob_components);
    }
    public isItem(): this is Item {
        return this.has(...item_components);
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
