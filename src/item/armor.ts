import type { ArmorData } from './armordata';
import type { Item } from './item';

export interface Armor extends Item {
    armor_data: ArmorData;
}
