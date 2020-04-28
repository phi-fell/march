import type { Location } from '../world/location';
import type { Item } from './item';

export interface WorldItemStack {
    item: Item;
    count: number;
    location: Location;
}
