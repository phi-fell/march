import type { Item } from './item';
import type { WeaponData } from './weapondata';

export interface Weapon extends Item {
    weapon_data: WeaponData;
}
