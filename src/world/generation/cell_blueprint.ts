import * as t from 'io-ts';
import type { ItemBlueprintManager } from '../../item/item_blueprint';
import { Chance } from '../../math/chance';
import { Random } from '../../math/random';
import { WeightedList } from '../../math/weighted_list';
import { Resource, ResourceManager } from '../../system/resource';
import type { Constructed } from '../../util/types';
import type { GeneratableCell } from '../cell';
import { CellAttributes } from './cellattributes';
import { CellGeneration, CELL_GENERATION } from './cellgeneration';
import type { MobBlueprintManager } from './mob_blueprint';

const MobIDList = WeightedList(t.string);
type MobIDList = Constructed<typeof MobIDList>;
const AdjacencyIDList = WeightedList(t.string);
type AdjacencyIDList = Constructed<typeof AdjacencyIDList>;

type CellBlueprintSchema = typeof CellBlueprintManager.schema;

export class CellBlueprintManager extends ResourceManager<typeof CellBlueprintManager.schema, CellBlueprint> {
    protected resource_class = CellBlueprint;
    public static schema = t.type({
        'name': t.string,
        'generation': t.keyof(CELL_GENERATION),
        'width': t.number,
        'height': t.number,
        'mobs': t.array(t.intersection([
            t.type({
                'id': MobIDList.schema,
                'count': Chance.schema,
            }),
            t.partial({
                'homogenous': t.boolean, // not homogeneous.  mob blueprints result in structurally similar but not identical entities
            }),
        ])),
        'adjacencies': t.array(t.intersection([
            t.type({
                'id': AdjacencyIDList.schema,
                'weight': Chance.schema,
            }),
            t.partial({
                'homogenous': t.boolean, // not homogeneous. instances are almost never identical but are struturally similar.
            }),
        ])),
    });
}

export class CellBlueprint extends Resource<CellBlueprintSchema> {
    private name: string = '';
    private generation: CELL_GENERATION = 0;
    private width: number = 0;
    private height: number = 0;
    private mobs: { id: MobIDList, count: Chance, homogenous?: boolean }[] = [];
    private adjacencies: { id: AdjacencyIDList, weight: Chance, homogenous?: boolean }[] = [];
    public fromJSON(json: t.TypeOf<CellBlueprintSchema>): void {
        this.name = json.name;
        this.generation = CELL_GENERATION[json.generation];
        this.width = json.width;
        this.height = json.height
        this.mobs = json.mobs.map((el) => {
            const ret: { id: MobIDList, count: Chance, homogenous?: boolean } = {
                'id': MobIDList.fromJSON(el.id),
                'count': Chance.fromJSON(el.count),
            };
            if (el.homogenous) {
                ret.homogenous = true;
            }
            return ret;
        });
        this.adjacencies = json.adjacencies.map((el) => {
            const ret: { id: AdjacencyIDList, weight: Chance, homogenous?: boolean } = {
                'id': AdjacencyIDList.fromJSON(el.id),
                'weight': Chance.fromJSON(el.weight),
            }
            if (el.homogenous) {
                ret.homogenous = true;
            }
            return ret;
        });
    }
    public toJSON() {
        return {
            'name': this.name,
            'generation': CELL_GENERATION[this.generation] as keyof typeof CELL_GENERATION,
            'width': this.width,
            'height': this.height,
            'mobs': this.mobs.map((el) => {
                return {
                    'id': el.id.toJSON(),
                    'count': el.count.toJSON(),
                    'homogenous': el.homogenous,
                };
            }),
            'adjacencies': this.adjacencies.map((el) => {
                return {
                    'id': el.id.toJSON(),
                    'weight': el.weight.toJSON(),
                    'homogenous': el.homogenous,
                };
            }),
        };
    }
    public getAttributes(seed: string = Random.uuid()): CellAttributes {
        return new CellAttributes(seed, this.generation, this.width, this.height);
    }
    public async generateCell(
        cell: GeneratableCell,
        mob_blueprint_manager: MobBlueprintManager,
        item_blueprint_manager: ItemBlueprintManager
    ): Promise<void> {
        CellGeneration.generateCell(cell);
        const board = cell.getBoard();
        for (const mob_entry of this.mobs) {
            if (mob_entry.homogenous) {
                const id = mob_entry.id.getValue();
                const blueprint = await mob_blueprint_manager.get(id);
                const count = mob_entry.count.getValue();
                if (blueprint) {
                    for (let i = 0; i < count; i++) {
                        board.addEntity(await blueprint.generateMob(mob_blueprint_manager, item_blueprint_manager, cell.getRandomPassableLocation()));
                    }
                } else {
                    console.log(`Could not add ${count} entities: ${id} - no blueprint found!`);
                }
            } else {
                const count = mob_entry.count.getValue();
                for (let i = 0; i < count; i++) {
                    const id = mob_entry.id.getValue();
                    const blueprint = await mob_blueprint_manager.get(id);
                    if (blueprint) {
                        board.addEntity(await blueprint.generateMob(mob_blueprint_manager, item_blueprint_manager, cell.getRandomPassableLocation()));
                    } else {
                        console.log(`Could not add entity: ${id} - no blueprint found!`);
                    }
                }
            }
        }
    }
}
