import { Location } from '../location';
import { Item } from './item';

export interface WorldItemStack {
    item: Item;
    count: number;
    location: Location;
}
