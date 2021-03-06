import * as t from 'io-ts';
import { CharacterSheet } from '../character/charactersheet';
import { Player } from '../world/player';
import { UserSettings } from './user_settings';

/*
    When changing User Schema:
    1. add new schema to the end of UserVersionSchemas array
    2. add update function that updates from the active version to this new version
    3. when ready, increment USER_FILE_CURRENT_VERSION
    4. change User class (in user.ts) toJSON, fromJSON, and anything else to fix errors and bring it in line with the new schema
*/

export const UserVersionSchema = t.union([
    t.type({
        'id': t.string,
        'name': t.string,
        'auth': t.type({
            'hash': t.string,
            'token': t.string,
            'token_creation_time': t.number,
        }),
        'unfinished_player': t.type({
            'name': t.string,
            'sheet': CharacterSheet.schema,
        }),
        'players': t.array(Player.schema),
    }),
    t.type({
        'version': t.literal(1),
        'id': t.string,
        'name': t.string,
        'auth': t.type({
            'hash': t.string,
            'token': t.string,
            'token_creation_time': t.number,
        }),
        'unfinished_player': t.type({
            'name': t.string,
            'sheet': CharacterSheet.schema,
        }),
        'players': t.array(Player.schema),
    }),
    t.type({
        'version': t.literal(2),
        'id': t.string,
        'name': t.string,
        'admin': t.boolean,
        'auth': t.type({
            'hash': t.string,
            'token': t.string,
            'token_creation_time': t.number,
        }),
        'unfinished_player': t.type({
            'name': t.string,
            'sheet': CharacterSheet.schema,
        }),
        'players': t.array(Player.schema),
    }),
    t.type({
        'version': t.literal(3),
        'id': t.string,
        'name': t.string,
        'admin': t.boolean,
        'auth': t.type({
            'hash': t.string,
            'token': t.string,
            'token_creation_time': t.number,
        }),
        'settings': UserSettings.schema,
        'unfinished_player': t.type({
            'name': t.string,
            'sheet': CharacterSheet.schema,
        }),
        'players': t.array(Player.schema),
    }),
]);
export const UserVersionSchemas = UserVersionSchema.types;
export const USER_FILE_CURRENT_VERSION = 3;

type VersionSchemaArray = typeof UserVersionSchemas;
type VersionSchema<T extends number = number> = t.TypeOf<VersionSchemaArray[T]>;

export type CurrentUserSchema = VersionSchema<typeof USER_FILE_CURRENT_VERSION>;

const UserVersionUpdate = [
    (json: VersionSchema<0>): VersionSchema<1> => {
        return {
            ...json,
            'version': 1,
        }
    },
    (json: VersionSchema<1>): VersionSchema<2> => {
        return {
            ...json,
            'admin': false,
            'version': 2,
        }
    },
    (json: VersionSchema<2>): VersionSchema<3> => {
        return {
            ...json,
            'settings': UserSettings.createFreshWithDefaults(),
            'version': 3,
        }
    },
] as const;

type UpdateFunction<T extends VersionSchema> = T extends { version: number }
    ? (typeof UserVersionUpdate)[T['version']]
    : (typeof UserVersionUpdate)[0];
type Update<T extends VersionSchema> = ReturnType<UpdateFunction<T>>;

type Equal<T, U> = [T] extends [U]
    ? ([U] extends [T]
        ? true
        : false)
    : false;

type R<T extends VersionSchema = VersionSchema<0>, U extends VersionSchema = never> = {
    'true': Equal<T, U> extends true ? never : VersionSchema<typeof USER_FILE_CURRENT_VERSION>,
    'false': Equal<T, U> extends true ? never : R<Update<T>, T>,
}[T extends VersionSchema<typeof USER_FILE_CURRENT_VERSION> ? 'true' : 'false'];

type VersionReachableThroughUpdates = R['version'];
const Assertion: VersionReachableThroughUpdates = USER_FILE_CURRENT_VERSION;

type AgnosticUpdateFunction = (json: VersionSchema) => VersionSchema;

export function updateUserSchema(json: VersionSchema): VersionSchema<typeof USER_FILE_CURRENT_VERSION> {
    if ('version' in json) {
        if (json.version === USER_FILE_CURRENT_VERSION) {
            return json;
        }
        return updateUserSchema((UserVersionUpdate[json.version] as AgnosticUpdateFunction)(json));
    }
    return updateUserSchema(UserVersionUpdate[0](json));

}
