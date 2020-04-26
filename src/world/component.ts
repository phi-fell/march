import * as t from 'io-ts';
import { CharacterSheet } from '../character/charactersheet';
import { Inventory } from '../item/inventory';
import { ItemData } from '../item/itemdata';
import type { ValueOf } from '../util/types';
import { Controller } from './controller';
import { DIRECTION } from './direction';
import { VisibilityManager } from './visibilitymanager';

const componentwrappers = {
    'direction': {
        'schema': t.keyof(DIRECTION),
        'fromJSON': (d: keyof typeof DIRECTION) => DIRECTION[d],
        'toJSON': (component: DIRECTION) => DIRECTION[component] as keyof typeof DIRECTION,
    },
    'sheet': {
        'schema': CharacterSheet.schema,
        'fromJSON': CharacterSheet.fromJSON,
        'toJSON': (component: CharacterSheet) => component.toJSON(),
    },
    'controller': {
        'schema': Controller.schema,
        'fromJSON': Controller.fromJSON,
        'toJSON': (component: Controller) => component.toJSON(),
    },
    'inventory': {
        'schema': Inventory.schema,
        'fromJSON': Inventory.fromJSON,
        'toJSON': (component: Inventory) => component.toJSON(),
    },
    'item_data': {
        'schema': ItemData.schema,
        'fromJSON': ItemData.fromJSON,
        'toJSON': (component: ItemData) => component.toJSON(),
    },
    'visibility_manager': {
        'schema': VisibilityManager.schema,
        'fromJSON': VisibilityManager.fromJSON,
        'toJSON': (component: VisibilityManager) => component.toJSON(),
    },
    'sprite': {
        'schema': t.string,
        'fromJSON': (json: string) => json,
        'toJSON': (component: string) => component,
    }
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
type FullComponents = {
    [P in ComponentName]: RetrieveComponent<ComponentWrappers[P]>;
}

export type Components = Partial<FullComponents>;

type ComponentWithName<T extends ComponentName, U extends FullComponents | Components> = U[T];
type ComponentsWithNames<T extends ComponentName[], U extends FullComponents | Components> =
    T extends { length: 0 } ? [] :
    T extends { length: 1 } ? [ComponentWithName<T[0], U>] :
    T extends { length: 2 } ? [ComponentWithName<T[0], U>, ComponentWithName<T[1], U>] :
    T extends { length: 3 } ? [ComponentWithName<T[0], U>, ComponentWithName<T[1], U>, ComponentWithName<T[2], U>] :
    T extends { length: 4 } ? [ComponentWithName<T[0], U>, ComponentWithName<T[1], U>, ComponentWithName<T[2], U>, ComponentWithName<T[3], U>] :
    T extends { length: 5 } ? [
        ComponentWithName<T[0], U>, ComponentWithName<T[1], U>, ComponentWithName<T[2], U>, ComponentWithName<T[3], U>, ComponentWithName<T[4], U>
    ] :
    never;
export type WithCallback<T extends ComponentName[]> = (...args: ComponentsWithNames<T, Components>) => void;
export type WithAllCallback<T extends ComponentName[]> = (...args: ComponentsWithNames<T, FullComponents>) => void;
// names must be a ...rest parameter or typescript will not type it correctly when this is called.
// passing ['a','b'] to names:[] will pass string[], whereas passing ,'a','b' to ...names:[] will pass ['a','b']
// as const doesn't work right because of the readonly.
function getComponents<T extends ComponentName[]>(components: Components, ...names: T): ComponentsWithNames<T, Components> {
    return names.map((name) => components[name]) as ComponentsWithNames<T, Components>;
}
function withComponents<T extends ComponentName[]>(components: Components, fun: WithCallback<T>, ...names: T) {
    fun(...getComponents(components, ...names));
}
function withAllComponents<T extends ComponentName[]>(components: Components, fun: WithAllCallback<T>, ...names: T) {
    const c = getComponents(components, ...names);
    for (const comp of c) {
        if (comp === undefined) {
            return;
        }
    }
    const args = c as ComponentsWithNames<T, FullComponents>;
    fun(...args);
}

type fromJSONFunction<T extends ComponentName> = (json: FullComponentsSchema[T]) => FullComponents[T];
function getFromJSON<T extends ComponentName>(name: T) {
    return componentwrappers[name].fromJSON as fromJSONFunction<T>;
}
type toJSONFunction<T extends ComponentName> = (component: FullComponents[T]) => FullComponentsSchema[T];
function getToJSON<T extends ComponentName>(name: T) {
    return componentwrappers[name].toJSON as toJSONFunction<T>;
}

function setComponentFromJSON<T extends ComponentName>(name: T, components: Components, json: ComponentsSchema) {
    const component_json = json[name];
    if (component_json) {
        components[name] = getFromJSON(name)(component_json);
    }
}

export const Components = {
    'schema': components_schema,
    'fromJSON': (json: ComponentsSchema) => {
        const ret = {} as Components;
        for (const name of ComponentNames) {
            setComponentFromJSON(name, ret, json);
        }
        return ret;
    },
    'toJSON': (components: Components) => {
        const ret = {} as ComponentsSchema;
        for (const name of ComponentNames) {
            const component = components[name];
            if (component) {
                ret[name] = getToJSON(name)(component);
            }
        }
        return ret;
    },
    getComponents,
    withComponents,
    withAllComponents,
};
