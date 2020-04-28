import * as t from 'io-ts';
import { CharacterAttributes } from '../../character/characterattributes';
import { CharacterSheet } from '../../character/charactersheet';
import { Random } from '../../math/random';
import { Resource, ResourceManager } from '../../system/resource';
import { Controller } from '../controller';
import { DIRECTION } from '../direction';
import { Entity } from '../entity';
import type { Location } from '../location';

function createBaseMob(loc: Location): Entity {
    const ret: Entity = new Entity(loc, Random.uuid(), true);
    ret.setComponent('direction', DIRECTION.NORTH);
    ret.setComponent('name', 'Unnamed');
    ret.setComponent('controller', Controller.fromJSON({
        'type': 'INERT',
    }));
    ret.setComponent('sheet', new CharacterSheet());
    return ret;
}

type MobBlueprintSchema = typeof MobBlueprintManager.schema;

export class MobBlueprintManager extends ResourceManager<typeof MobBlueprintManager.schema, MobBlueprint> {
    protected resource_class = MobBlueprint;
    public static schema = t.partial({
        'extends': t.string,
        'name': t.string,
        'sprite': t.string,
        'race': t.string,
        'attributes': t.partial(CharacterAttributes.schema.props),
    });
}

export class MobBlueprint extends Resource<MobBlueprintSchema> {
    private extends?: string;
    private name?: string;
    private sprite?: string;
    public fromJSON(json: t.TypeOf<MobBlueprintSchema>): void {
        if (json.name) {
            this.name = json.name;
        }
        if (json.sprite) {
            this.sprite = json.sprite;
        }
    }
    public toJSON() {
        const ret: t.TypeOf<MobBlueprintSchema> = {};
        if (this.name) {
            ret.name = this.name;
        }
        if (this.sprite) {
            ret.sprite = this.sprite;
        }
        return ret;
    }
    public async generateMob(mob_blueprint_manager: MobBlueprintManager, loc: Location): Promise<Entity> {
        const ret = (this.extends === undefined)
            ? (createBaseMob(loc))
            : (await (await mob_blueprint_manager.get(this.extends)).generateMob(mob_blueprint_manager, loc));
        if (this.name) {
            ret.setComponent('name', this.name);
        }
        if (this.sprite) {
            ret.setComponent('sprite', this.sprite);
        }
        return ret;
    }
}
