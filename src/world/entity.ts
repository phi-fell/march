import * as t from 'io-ts';
import type { Item } from '../item/item';
import { Random, UUID } from '../math/random';
import type { ValueOfArray } from '../util/types';
import type { Cell } from './cell';
import { ComponentName, Components, ComponentsWith, ComponentsWithNames, FullComponents } from './component';
import { AddEntityEvent } from './event/add_entity_event';
import { Locatable, locatable_schema } from './locatable';
import { Location } from './location';

export interface EntityWith<T extends ComponentName> extends Entity {
    components: ComponentsWith<T>; // needed or for some reason EntityWith<T> are all assignable (e.g. EntityWith<'direction> = EntityWith<never> is valid)
    getComponent<U extends ComponentName>(name: U): ComponentsWith<T>[U];
    getComponents<U extends ComponentName[]>(...names: U): ComponentsWithNames<U, ComponentsWith<T>>;
    setComponent<U extends ComponentName>(name: U, component: FullComponents[U]): asserts this is EntityWith<T | U>;
    /**
     * Only call on raw Entity.
     * if you need to call this otherwise, cast to Entity first
     * asserts so that calling will result in an error
     *
     * (changing Entity.removeComponent to an assertion will fix this error but result in improper type assertion)
     * see https://stackoverflow.com/q/61508583/10039628
     */
    removeComponent<U extends ComponentName>(name: U): asserts this is EntityWith<Exclude<T, U>>;
}

const mob_components = ['name', 'sprite', 'controller', 'sheet', 'inventory', 'collidable'] as const;
type MobComponents = ValueOfArray<typeof mob_components>;
export type Mob = EntityWith<MobComponents>;

const item_components = ['name', 'sprite', 'item_data'] as const;
type ItemComponents = ValueOfArray<typeof item_components>;
export type ItemEntity = EntityWith<ItemComponents>;

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

    public static createItemEntity(item: Item, loc: Location) {
        const ret: Entity = new Entity(loc);
        ret.setComponent('item_data', item);
        ret.setComponent('name', item.name);
        ret.setComponent('sprite', item.sprite);
        loc.cell.emit(new AddEntityEvent(ret), loc)
        return ret;
    }

    public components: Components = {};
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
    public isItem(): this is ItemEntity {
        return this.has(...item_components);
    }

    public getComponent<T extends ComponentName>(name: T) {
        return this.components[name];
    }
    public getComponents<T extends ComponentName[]>(...names: T) {
        return Components.getComponents(this.components, ...names);
    }

    public setComponent<T extends ComponentName>(name: T, component: FullComponents[T]): asserts this is EntityWith<T> {
        this.components[name] = component;
    }

    // returns void intentionally see EntityWith<T>
    public removeComponent<T extends ComponentName>(name: T): void {
        this.components[name] = undefined;
    }

    public isCollidable(): boolean {
        return this.has('collidable') && this.components.collidable;
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
    public getClientJSON(viewer: Entity) {
        return {
            'id': this.id,
            'location': this.location.getClientJSON(viewer),
            'components': Components.getClientJSON(this.components, viewer),
        }
    }
}
