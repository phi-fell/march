import * as t from 'io-ts';
import { CharacterSheet } from '../character/charactersheet';
import { getTilePalette } from '../tile';

/*
    When changing Player Schema:
    1. add new schema to the end of PlayerVersionSchemas array
    2. add update function that updates from the active version to this new version
    3. when ready, increment PLAYER_FILE_CURRENT_VERSION
    4. change Player class (in player.ts) toJSON, fromJSON, and anything else to fix errors and bring it in line with the new schema
*/

const entity_ref_schema = t.type({
    'instance_id': t.string,
    'cell_id': t.string,
    'entity_id': t.string,
});

const seen_cache_schema = t.array(t.type({
    'instance_id': t.string,
    'cell_id': t.string,
    'width': t.number,
    'height': t.number,
    'tiles': t.array(t.array(t.number)),
}));

export type EntityRef = t.TypeOf<typeof entity_ref_schema>;

export type SeenCache = t.TypeOf<typeof seen_cache_schema>;

export const PlayerVersionSchema = t.union([
    t.type({
        'id': t.string,
        'name': t.string,
        'sheet': CharacterSheet.schema,
        'entity_ref': t.union([entity_ref_schema, t.undefined]),
    }),
    t.type({
        'version': t.literal(1),
        'id': t.string,
        'name': t.string,
        'sheet': CharacterSheet.schema,
        'entity_ref': t.union([entity_ref_schema, t.undefined]),
    }),
    t.type({
        'version': t.literal(2),
        'id': t.string,
        'name': t.string,
        'sheet': CharacterSheet.schema,
        'entity_ref': t.union([entity_ref_schema, t.undefined]),
        'seen_cache': seen_cache_schema,
        'seen_cache_palette': t.array(t.string),
    }),
]);
export const PlayerVersionSchemas = PlayerVersionSchema.types;
export const PLAYER_FILE_CURRENT_VERSION = 2;

type VersionSchemaArray = typeof PlayerVersionSchemas;
type VersionSchema<T extends number = number> = t.TypeOf<VersionSchemaArray[T]>;

export type CurrentPlayerSchema = VersionSchema<typeof PLAYER_FILE_CURRENT_VERSION>;

const PlayerVersionUpdate = [
    (json: VersionSchema<0>): VersionSchema<1> => {
        return {
            ...json,
            'version': 1,
        }
    },
    (json: VersionSchema<1>): VersionSchema<2> => {
        return {
            ...json,
            'version': 2,
            'seen_cache': [],
            'seen_cache_palette': getTilePalette(),
        }
    },
] as const;

type UpdateFunction<T extends VersionSchema> = T extends { version: number }
    ? (typeof PlayerVersionUpdate)[T['version']]
    : (typeof PlayerVersionUpdate)[0];
type Update<T extends VersionSchema> = ReturnType<UpdateFunction<T>>;

type Equal<T, U> = [T] extends [U]
    ? ([U] extends [T]
        ? true
        : false)
    : false;

type R<T extends VersionSchema = VersionSchema<0>, U extends VersionSchema = never> = {
    'true': Equal<T, U> extends true ? never : VersionSchema<typeof PLAYER_FILE_CURRENT_VERSION>,
    'false': Equal<T, U> extends true ? never : R<Update<T>, T>,
}[T extends VersionSchema<typeof PLAYER_FILE_CURRENT_VERSION> ? 'true' : 'false'];

type VersionReachableThroughUpdates = R['version'];
const Assertion: VersionReachableThroughUpdates = PLAYER_FILE_CURRENT_VERSION;

export function updatePlayerSchema(json: VersionSchema): VersionSchema<typeof PLAYER_FILE_CURRENT_VERSION> {
    if ('version' in json) {
        if (json.version === PLAYER_FILE_CURRENT_VERSION) {
            return json;
        }
        return updatePlayerSchema(PlayerVersionUpdate[json.version](json));
    }
    return updatePlayerSchema(PlayerVersionUpdate[0](json));
}
