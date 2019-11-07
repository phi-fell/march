import { ArmorData } from './armordata';
import { Item } from './item';

export interface Armor extends Item {
    armor_data: ArmorData;
}
