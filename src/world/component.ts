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
} as const;


export type ComponentName = keyof typeof componentwrappers;
const ComponentNames = Object.keys(componentwrappers) as ComponentName[];
type FlattenComponents<T> = T extends { fromJSON: (...args: any) => infer U } ? U : never;
export type Component = FlattenComponents<ValueOf<typeof componentwrappers>>;

type ComponentsSchemaEntries = {
    [P in ComponentName]: typeof componentwrappers[P]['schema'];
}
const components_schema = t.partial(
    Object.fromEntries(Object.entries(componentwrappers).map(([p, v]) => [p, v.schema])) as ComponentsSchemaEntries
);

export type ComponentsSchema = t.TypeOf<typeof components_schema>;

type RetrieveComponent<T> = T extends { 'fromJSON': (...args: any) => infer U } ? U : never
type FullComponents = {
    [P in ComponentName]: RetrieveComponent<typeof componentwrappers[P]>;
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
function withComponents<T extends ComponentName[]>(components: Components, fun: WithCallback<T>, ...names: T) {
    const c = names.map((name) => components[name]);
    fun(...c as ComponentsWithNames<T, Components>);
}
function withAllComponents<T extends ComponentName[]>(components: Components, fun: WithAllCallback<T>, ...names: T) {
    const c = names.map((name) => components[name]);
    for (const comp of c) {
        if (comp === undefined) {
            return;
        }
    }
    const args = c as ComponentsWithNames<T, FullComponents>;
    fun(...args);
}

export const Components = {
    'schema': components_schema,
    'fromJSON': (json: ComponentsSchema) => {
        const ret = {} as Components;
        for (const name of ComponentNames) {
            const component_json = json[name];
            if (component_json) {
                ret[name] = componentwrappers[name].fromJSON(component_json) as any;
            }
        }
        return ret;
    },
    'toJSON': (components: Components) => {
        const ret = {} as ComponentsSchema;
        for (const name of ComponentNames) {
            const component = components[name];
            if (component) {
                ret[name] = componentwrappers[name].toJSON(component as any);
            }
        }
        return ret;
    },
    withComponents,
    withAllComponents,
};
