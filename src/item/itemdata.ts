import * as t from 'io-ts';

export type ItemDataSchema = t.TypeOf<typeof ItemData.schema>;

export class ItemData {
    public static schema = t.type({
        'id': t.string,
        'name': t.string,
        'stackable': t.boolean,
    });

    public static fromJSON(json: ItemDataSchema): ItemData {
        const ret = new ItemData();
        ret.id = json.id;
        ret.name = json.name;
        ret.stackable = json.stackable
        return ret;
    }

    public id: string = '';
    public name: string = '';
    public stackable: boolean = true;
    public toJSON(): ItemDataSchema {
        return {
            'id': this.id,
            'name': this.name,
            'stackable': this.stackable,
        }
    }
}
