import type { Location } from '../location';
import type { Item } from './item';

export interface WorldItemStack {
    item: Item;
    count: number;
    location: Location;
}
