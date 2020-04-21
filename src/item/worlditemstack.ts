import type { Location } from '../deprecated/old_location';
import type { Item } from './item';

export interface WorldItemStack {
    item: Item;
    count: number;
    location: Location;
}
