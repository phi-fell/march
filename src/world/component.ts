import * as t from 'io-ts';
import { CharacterSheet } from '../character/charactersheet';
import { Inventory } from '../item/inventory';
import { Item } from '../item/item';
import type { ValueOf, ValueOfArray } from '../util/types';
import { Controller } from './controller';
import { CorpseData } from './corpse_data';
import { DIRECTION } from './direction';
import type { Entity } from './entity';
import type { Player } from './player';
import { Portal } from './portal';
import { VisibilityManager } from './visibilitymanager';

function getPrimitiveComponent<T extends t.Any>(schema: T) {
    return {
        schema,
        'fromJSON': (json: t.TypeOf<T>) => json,
        'toJSON': (component: t.TypeOf<T>) => component,
        'getClientJSON': (component: t.TypeOf<T>, viewer: Entity) => component,
    }
}

const componentwrappers = {
    'player': {
        'schema': t.any,
        'fromJSON': () => undefined as any as Player,
        'toJSON': () => undefined,
        'getClientJSON': () => undefined,
    },
    'direction': {
        'schema': t.keyof(DIRECTION),
        'fromJSON': (d: keyof typeof DIRECTION) => DIRECTION[d],
        'toJSON': (component: DIRECTION) => DIRECTION[component] as keyof typeof DIRECTION,
        'getClientJSON': (component: DIRECTION, viewer: Entity) => DIRECTION[component] as keyof typeof DIRECTION
    },
    'sheet': {
        'schema': CharacterSheet.schema,
        'fromJSON': CharacterSheet.fromJSON,
        'toJSON': (component: CharacterSheet) => component.toJSON(),
        'getClientJSON': (component: CharacterSheet, viewer: Entity) => component.getClientJSON(viewer),
    },
    'controller': {
        'schema': Controller.schema,
        'fromJSON': Controller.fromJSON,
        'toJSON': (component: Controller) => component.toJSON(),
        'getClientJSON': (component: Controller, viewer: Entity) => component.getClientJSON(viewer),
    },
    'inventory': {
        'schema': Inventory.schema,
        'fromJSON': Inventory.fromJSON,
        'toJSON': (component: Inventory) => component.toJSON(),
        'getClientJSON': (component: Inventory, viewer: Entity) => component.getClientJSON(viewer),
    },
    'item_data': {
        'schema': Item.schema,
        'fromJSON': Item.fromJSON,
        'toJSON': (component: Item) => component.toJSON(),
        'getClientJSON': (component: Item, viewer: Entity) => component.getClientJSON(viewer),
    },
    'corpse_data': {
        'schema': CorpseData.schema,
        'fromJSON': CorpseData.fromJSON,
        'toJSON': (component: CorpseData) => component.toJSON(),
        'getClientJSON': (component: CorpseData, viewer: Entity) => component.getClientJSON(viewer),
    },
    'visibility_manager': {
        'schema': VisibilityManager.schema,
        'fromJSON': VisibilityManager.fromJSON,
        'toJSON': (component: VisibilityManager) => component.toJSON(),
        'getClientJSON': (component: VisibilityManager, viewer: Entity) => component.getClientJSON(viewer),
    },
    'portal': {
        'schema': Portal.schema,
        'fromJSON': Portal.fromJSON,
        'toJSON': (component: Portal) => component.toJSON(),
        'getClientJSON': (component: Portal, viewer: Entity) => component.getClientJSON(viewer),
    },
    'sprite': getPrimitiveComponent(t.string),
    'name': getPrimitiveComponent(t.string),
    'collidable': getPrimitiveComponent(t.boolean),
} as const;

type ComponentWrappers = typeof componentwrappers;
export type ComponentName = keyof ComponentWrappers;
type ComponentWrapper = ValueOf<ComponentWrappers>
const ComponentNames = Object.keys(componentwrappers) as ComponentName[];
type FlattenComponents<T> = T extends { fromJSON: (...args: any) => infer U } ? U : never;
export type Component = FlattenComponents<ComponentWrapper>;

type ComponentsSchemaEntries = {
    [P in ComponentName]: ComponentWrappers[P]['schema'];
}
const components_schema = t.partial(
    Object.fromEntries(Object.entries(componentwrappers).map(([p, v]) => [p, v.schema])) as ComponentsSchemaEntries
);

export type ComponentsSchema = t.TypeOf<typeof components_schema>;
type FullComponentsSchema = t.TypeOf<t.TypeC<ComponentsSchemaEntries>>;

type RetrieveComponent<T> = T extends { 'fromJSON': (...args: any) => infer U } ? U : never
export type FullComponents = {
    [P in ComponentName]: RetrieveComponent<ComponentWrappers[P]>;
}

export type Components = Partial<FullComponents>;

export type ComponentsWith<T extends ComponentName> = Components & {
    [P in T]: RetrieveComponent<ComponentWrappers[P]>;
};

type ComponentWithName<T extends ComponentName, U extends FullComponents | Components> = U[T];
export type ComponentsWithNames<T extends ComponentName[], U extends FullComponents | Components> =
    T extends { length: 0 } ? [] :
    T extends { length: 1 } ? [ComponentWithName<T[0], U>] :
    T extends { length: 2 } ? [ComponentWithName<T[0], U>, ComponentWithName<T[1], U>] :
    T extends { length: 3 } ? [ComponentWithName<T[0], U>, ComponentWithName<T[1], U>, ComponentWithName<T[2], U>] :
    T extends { length: 4 } ? [ComponentWithName<T[0], U>, ComponentWithName<T[1], U>, ComponentWithName<T[2], U>, ComponentWithName<T[3], U>] :
    T extends { length: 5 } ? [
        ComponentWithName<T[0], U>, ComponentWithName<T[1], U>, ComponentWithName<T[2], U>, ComponentWithName<T[3], U>, ComponentWithName<T[4], U>
    ] :
    T extends { length: 6 } ? [
        ComponentWithName<T[0], U>, ComponentWithName<T[1], U>, ComponentWithName<T[2], U>, ComponentWithName<T[3], U>, ComponentWithName<T[4], U>,
        ComponentWithName<T[5], U>
    ] :
    T extends { length: 7 } ? [
        ComponentWithName<T[0], U>, ComponentWithName<T[1], U>, ComponentWithName<T[2], U>, ComponentWithName<T[3], U>, ComponentWithName<T[4], U>,
        ComponentWithName<T[5], U>, ComponentWithName<T[6], U>
    ] :
    T extends { length: 8 } ? [
        ComponentWithName<T[0], U>, ComponentWithName<T[1], U>, ComponentWithName<T[2], U>, ComponentWithName<T[3], U>, ComponentWithName<T[4], U>,
        ComponentWithName<T[5], U>, ComponentWithName<T[6], U>, ComponentWithName<T[7], U>
    ] :
    T extends { length: 9 } ? [
        ComponentWithName<T[0], U>, ComponentWithName<T[1], U>, ComponentWithName<T[2], U>, ComponentWithName<T[3], U>, ComponentWithName<T[4], U>,
        ComponentWithName<T[5], U>, ComponentWithName<T[6], U>, ComponentWithName<T[7], U>, ComponentWithName<T[8], U>
    ] :
    never;

// names must be a ...rest parameter or typescript will not type it correctly when this is called.
// passing ['a','b'] to names:[] will pass string[], whereas passing ,'a','b' to ...names:[] will pass ['a','b']
// as const doesn't work right because of the readonly.
function getComponents<T extends ComponentName[]>(components: Components, ...names: T): ComponentsWithNames<T, Components> {
    return names.map((name) => components[name]) as ComponentsWithNames<T, Components>;
}

function hasComponents<T extends ComponentName[]>(components: Components, ...names: T): components is ComponentsWith<ValueOfArray<T>> {
    for (const name of names) {
        if (components[name] === undefined) {
            return false;
        }
    }
    return true;
}

type fromJSONFunction<T extends ComponentName> = (json: FullComponentsSchema[T], entity: Entity) => FullComponents[T];
function getFromJSON<T extends ComponentName>(name: T) {
    return componentwrappers[name].fromJSON as fromJSONFunction<T>;
}
type toJSONFunction<T extends ComponentName> = (component: FullComponents[T]) => FullComponentsSchema[T];
function getToJSON<T extends ComponentName>(name: T) {
    return componentwrappers[name].toJSON as any as toJSONFunction<T>;
}
type getClientJSONFunction<T extends ComponentName> = (component: FullComponents[T], viewer: Entity) => any;
function getGetClientJSON<T extends ComponentName>(name: T) {
    return componentwrappers[name].getClientJSON as any as getClientJSONFunction<T>;
}

function setComponentFromJSON<T extends ComponentName>(name: T, components: Components, json: ComponentsSchema, entity: Entity) {
    const component_json = json[name];
    if (component_json !== undefined) {
        components[name] = getFromJSON(name)(component_json as FullComponentsSchema[T], entity);
    }
}

export const Components = {
    'schema': components_schema,
    'fromJSON': (json: ComponentsSchema, entity: Entity) => {
        const ret = {} as Components;
        for (const name of ComponentNames) {
            setComponentFromJSON(name, ret, json, entity);
        }
        return ret;
    },
    'toJSON': (components: Components) => {
        const ret = {} as ComponentsSchema;
        for (const name of ComponentNames) {
            const component = components[name];
            if (component !== undefined) {
                ret[name] = getToJSON(name)(component);
            }
        }
        return ret;
    },
    'getClientJSON': (components: Components, viewer: Entity) => {
        const ret = {} as any;
        for (const name of ComponentNames) {
            const component = components[name];
            if (component !== undefined) {
                const json = getGetClientJSON(name)(component, viewer);
                if (json !== undefined) {
                    ret[name] = json;
                }
            }
        }
        return ret;
    },
    hasComponents,
    getComponents,
};
