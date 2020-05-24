import * as t from 'io-ts';
import { CharacterAttributes } from '../../character/characterattributes';
import { CharacterRace } from '../../character/characterrace';
import { CharacterSheet } from '../../character/charactersheet';
import type { Globals } from '../../globals';
import { Inventory } from '../../item/inventory';
import { Chance } from '../../math/chance';
import { Random } from '../../math/random';
import { WeightedList } from '../../math/weighted_list';
import { Resource, ResourceManager } from '../../system/resource';
import type { Constructed } from '../../util/types';
import { Controller } from '../controller';
import { CONTROLLER } from '../controller/controllers';
import { DIRECTION } from '../direction';
import { Entity, Mob } from '../entity';
import type { Location } from '../location';

function createBaseMob(loc: Location): Mob {
    const ret: Entity = new Entity(loc, Random.uuid(), true);
    ret.setComponent('name', 'Unnamed');
    ret.setComponent('sprite', 'none');
    ret.setComponent('direction', DIRECTION.NORTH);
    ret.setComponent('controller', Controller.fromJSON({
        'type': 'WANDER',
    }, ret));
    ret.setComponent('sheet', new CharacterSheet());
    ret.setComponent('inventory', new Inventory());
    ret.setComponent('collidable', true);
    return ret;
}

const ItemIDList = WeightedList(t.string);
type ItemIDList = Constructed<typeof ItemIDList>;

type MobBlueprintSchema = typeof MobBlueprintManager.schema;

export class MobBlueprintManager extends ResourceManager<typeof MobBlueprintManager.schema, MobBlueprint> {
    protected resource_class = MobBlueprint;
    public static schema = t.partial({
        'extends': t.string,
        'name': t.string,
        'sprite': t.string,
        'controller': t.keyof(CONTROLLER),
        'race': t.string,
        'attributes': t.partial(CharacterAttributes.schema.props),
        'items': t.array(t.intersection([
            t.type({
                'id': ItemIDList.schema,
                'count': Chance.schema,
            }),
            t.partial({
                'homogenous': t.boolean, // not homogeneous.  item blueprints result in structurally similar but not guaranteed identical entities
            }),
        ])),
    });
}

export class MobBlueprint extends Resource<MobBlueprintSchema> {
    private extends?: string;
    private name?: string;
    private sprite?: string;
    private race?: string;
    private controller?: CONTROLLER;
    private items: { id: ItemIDList, count: Chance, homogenous?: boolean }[] = [];
    public fromJSON(json: t.TypeOf<MobBlueprintSchema>): void {
        if (json.extends !== undefined) {
            this.extends = json.extends
        }
        if (json.name !== undefined) {
            this.name = json.name;
        }
        if (json.sprite !== undefined) {
            this.sprite = json.sprite;
        }
        if (json.race !== undefined) {
            this.race = json.race;
        }
        if (json.controller !== undefined) {
            this.controller = CONTROLLER[json.controller];
        }
        if (json.items) {
            this.items = json.items.map((el) => {
                const ret: { id: ItemIDList, count: Chance, homogenous?: boolean } = {
                    'id': ItemIDList.fromJSON(el.id),
                    'count': Chance.fromJSON(el.count),
                };
                if (el.homogenous) {
                    ret.homogenous = true;
                }
                return ret;
            });
        }
    }
    public toJSON() {
        const ret: t.TypeOf<MobBlueprintSchema> = {};
        if (this.extends !== undefined) {
            ret.extends = this.extends;
        }
        if (this.name !== undefined) {
            ret.name = this.name;
        }
        if (this.sprite !== undefined) {
            ret.sprite = this.sprite;
        }
        if (this.race !== undefined) {
            ret.race = this.race;
        }
        if (this.controller !== undefined) {
            ret.controller = CONTROLLER[this.controller] as keyof typeof CONTROLLER;
        }
        if (this.items) {
            ret.items = this.items.map((el) => {
                return {
                    'id': el.id.toJSON(),
                    'count': el.count.toJSON(),
                    'homogenous': el.homogenous,
                };
            });
        }
        return ret;
    }
    public async generateMob(globals: Globals, loc: Location): Promise<Mob> {
        const ret: Mob = await (async () => {
            if (this.extends === undefined) {
                return createBaseMob(loc);
            }
            const blueprint = await globals.mob_blueprint_manager.get(this.extends);
            if (!blueprint) {
                console.log(`Could not extend nonexistent blueprint: ${this.extends}!`);
                return createBaseMob(loc);
            }
            return (blueprint.generateMob(globals, loc));
        })();
        if (this.name !== undefined) {
            ret.setComponent('name', this.name);
        }
        if (this.sprite !== undefined) {
            ret.setComponent('sprite', this.sprite);
        }
        if (this.race !== undefined) {
            const sheet = ret.getComponent('sheet');
            if (sheet !== undefined) {
                sheet.race = new CharacterRace(this.race);
                if (sheet.race.traits.includes('omnidirectional')) {
                    ret.removeComponent('direction');
                }
            }
        }
        if (this.controller !== undefined) {
            ret.setComponent('controller', Controller.getNewController(this.controller))
        }
        const inventory = ret.getComponent('inventory');
        for (const item_entry of this.items) {
            if (item_entry.homogenous) {
                const id = item_entry.id.getValue();
                const blueprint = await globals.item_blueprint_manager.get(id);
                const count = item_entry.count.getValue();
                if (blueprint !== undefined) {
                    const item = await blueprint.generateItem(globals.item_blueprint_manager);
                    item.count = count;
                    inventory.addItem(item);
                } else {
                    console.log(`Could not add ${count} items: ${id} - no blueprint found!`);
                }
            } else {
                const count = item_entry.count.getValue();
                for (let i = 0; i < count; i++) {
                    const id = item_entry.id.getValue();
                    const blueprint = await globals.item_blueprint_manager.get(id);
                    if (blueprint !== undefined) {
                        inventory.addItem(await blueprint.generateItem(globals.item_blueprint_manager));
                    } else {
                        console.log(`Could not add item: ${id} - no blueprint found!`);
                    }
                }
            }
        }
        return ret;
    }
}
