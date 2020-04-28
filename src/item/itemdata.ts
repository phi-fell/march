import * as t from 'io-ts';

export type ItemDataSchema = t.TypeOf<typeof ItemData.schema>;

export class ItemData {
    public static schema = t.type({
        'name': t.string,
        'stackable': t.boolean,
    });

    public static fromJSON(json: ItemDataSchema): ItemData {
        const ret = new ItemData();
        ret.name = json.name;
        ret.stackable = json.stackable
        return ret;
    }

    public name: string = '';
    public stackable: boolean = true;
    public toJSON(): ItemDataSchema {
        return {
            'name': this.name,
            'stackable': this.stackable,
        }
    }
}
