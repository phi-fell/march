import { ItemBlueprintManager } from './item/item_blueprint';
import { CellBlueprintManager } from './world/generation/cell_blueprint';
import { MobBlueprintManager } from './world/generation/mob_blueprint';

export class Globals {
    public cell_blueprint_manager: CellBlueprintManager = new CellBlueprintManager('res/environment');
    public mob_blueprint_manager: MobBlueprintManager = new MobBlueprintManager('res/mob');
    public item_blueprint_manager: ItemBlueprintManager = new ItemBlueprintManager('res/item');
}
