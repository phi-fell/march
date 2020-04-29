import * as t from 'io-ts';
import { Resource, ResourceManager } from '../system/resource';
import { ArmorData } from './armordata';
import { Item } from './item';
import { WeaponData } from './weapondata';

type ItemBlueprintSchema = typeof ItemBlueprintManager.schema;

export class ItemBlueprintManager extends ResourceManager<typeof ItemBlueprintManager.schema, ItemBlueprint> {
    protected resource_class = ItemBlueprint;
    public static schema = t.partial({
        'extends': t.string,
        'name': t.string,
        'sprite': t.string,
        'stackable': t.boolean,
        'count': t.number,
        'weapon_data': WeaponData.schema,
        'armor_data': ArmorData.schema,
    });
}

export class ItemBlueprint extends Resource<ItemBlueprintSchema> {
    private extends?: string;
    private name?: string;
    private sprite?: string;
    public stackable?: boolean;
    public count?: number;
    public weapon_data?: WeaponData;
    public armor_data?: ArmorData;
    public fromJSON(json: t.TypeOf<ItemBlueprintSchema>): void {
        if (json.extends !== undefined) {
            this.extends = json.extends
        }
        if (json.name !== undefined) {
            this.name = json.name;
        }
        if (json.sprite !== undefined) {
            this.sprite = json.sprite;
        }
        if (json.stackable !== undefined) {
            this.stackable = json.stackable;
        }
        if (json.count !== undefined) {
            this.count = json.count;
        }
        if (json.weapon_data !== undefined) {
            this.weapon_data = WeaponData.fromJSON(json.weapon_data);
        }
        if (json.armor_data !== undefined) {
            this.armor_data = ArmorData.fromJSON(json.armor_data);
        }
    }
    public toJSON() {
        const ret: t.TypeOf<ItemBlueprintSchema> = {};
        if (this.extends !== undefined) {
            ret.extends = this.extends;
        }
        if (this.name !== undefined) {
            ret.name = this.name;
        }
        if (this.sprite !== undefined) {
            ret.sprite = this.sprite;
        }
        if (this.stackable !== undefined) {
            ret.stackable = this.stackable;
        }
        if (this.count !== undefined) {
            ret.count = this.count;
        }
        if (this.weapon_data !== undefined) {
            ret.weapon_data = this.weapon_data.toJSON();
        }
        if (this.armor_data !== undefined) {
            ret.armor_data = this.armor_data.toJSON();
        }
        return ret;
    }
    public async generateItem(item_blueprint_manager: ItemBlueprintManager): Promise<Item> {
        const ret: Item = await (async () => {
            if (this.extends !== undefined) {
                const blueprint = await item_blueprint_manager.get(this.extends);
                if (blueprint) {
                    return blueprint.generateItem(item_blueprint_manager);
                }
                console.log(`Could not extend nonexistent blueprint: ${this.extends}!`);
            }
            return new Item('ERROR', 'Unnamed', 'none', false, 1);
        })();
        ret.id = this.id;
        if (this.name !== undefined) {
            ret.name = this.name;
        }
        if (this.sprite !== undefined) {
            ret.sprite = this.sprite;
        }
        if (this.stackable !== undefined) {
            ret.stackable = this.stackable;
        }
        if (this.count !== undefined) {
            ret.count = this.count;
        }
        if (this.weapon_data !== undefined) {
            ret.weapon_data = this.weapon_data.clone();
        }
        if (this.armor_data !== undefined) {
            ret.armor_data = this.armor_data.clone();
        }
        return ret;
    }
}
