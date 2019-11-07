import { Item } from './item';
import { WeaponData } from './weapondata';

export interface Weapon extends Item {
    weapon_data: WeaponData;
}
