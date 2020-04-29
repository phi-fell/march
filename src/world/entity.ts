import * as t from 'io-ts';
import { Random, UUID } from '../math/random';
import type { ValueOfArray } from '../util/types';
import type { Cell } from './cell';
import { ComponentName, Components, ComponentsWith, ComponentsWithNames, FullComponents } from './component';
import { Locatable, locatable_schema } from './locatable';
import { Location } from './location';

export interface EntityWith<T extends ComponentName> extends Entity {
    components: ComponentsWith<T>; // needed or for some reason EntityWith<T> are all assignable (e.g. EntityWith<'direction> = EntityWith<never> is valid)
    getComponent<U extends ComponentName>(name: U): ComponentsWith<T>[U];
    getComponents<U extends ComponentName[]>(...names: U): ComponentsWithNames<U, ComponentsWith<T>>;
    setComponent<U extends ComponentName>(name: U, component: FullComponents[U]): asserts this is EntityWith<T | U>;
    removeComponent<U extends ComponentName>(name: U): asserts this is EntityWith<Exclude<T, U>>;
}

const mob_components = ['name', 'sprite', 'controller', 'sheet', 'inventory'] as const;
type MobComponents = ValueOfArray<typeof mob_components>;
export type Mob = EntityWith<MobComponents>;

const item_components = ['name', 'sprite', 'item_data'] as const;
type ItemComponents = ValueOfArray<typeof item_components>;
export type Item = EntityWith<ItemComponents>;

const weapon_components = ['weapon_data'] as const;
type WeaponComponents = ValueOfArray<typeof weapon_components>;
export type Weapon = EntityWith<WeaponComponents>;

const armor_components = ['armor_data'] as const;
type ArmorComponents = ValueOfArray<typeof armor_components>;
export type Armor = EntityWith<ArmorComponents>;

export type WeaponItem = EntityWith<WeaponComponents | ItemComponents>;
export type ArmorItem = EntityWith<ArmorComponents | ItemComponents>;

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
    public isItem(): this is Item {
        return this.has(...item_components);
    }
    public isWeapon(): this is Weapon {
        return this.has(...weapon_components);
    }
    public isWeaponItem(): this is WeaponItem {
        return this.isWeapon() && this.isItem();
    }
    public isArmor(): this is Armor {
        return this.has(...armor_components);
    }
    public isArmorItem(): this is ArmorItem {
        return this.isArmor() && this.isItem();
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

    public removeComponent<T extends ComponentName>(name: T): asserts this is Entity {
        this.components[name] = undefined;
    }

    public isCollidable(): boolean {
        // TODO: give entities a component that makes them collide?
        // i.e. delete this function and add some component that handles that
        // (even if the component is just a boolean with an entry in component_wrappers)
        return true;
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
