import * as t from 'io-ts';
import { Resource, ResourceManager } from '../../system/resource';

type CellBlueprintSchema = typeof CellBlueprintManager.schema;

export class CellBlueprintManager extends ResourceManager<CellBlueprintSchema, CellBlueprint> {
    protected resource_class = CellBlueprint;
    public static schema = t.type({
        'idk': t.string,
        'no_idea': t.number,
    });

}

export class CellBlueprint extends Resource<CellBlueprintSchema> {
    public fromJSON(json: any): void {
        // TODO
    }
    public toJSON() {
        return {
            'idk': 'asdf',
            'no_idea': 5,
        };
    }
}
