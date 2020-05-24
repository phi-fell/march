export interface Location {
    x: number;
    y: number;
}

export enum DIRECTION {
    NORTH,
    WEST,
    SOUTH,
    EAST,
}

export enum RELATIVE_DIRECTION {
    FORWARD,
    LEFT,
    BACKWARD,
    RIGHT,
}

export enum ATTRIBUTE {
    STRENGTH,
    ENDURANCE,
    VITALITY,
    AGILITY,
    DEXTERITY,
    SPEED,
    LOGIC,
    INTUITION,
    PERCEPTION,
    CHARISMA,
    WILL,
    LUCK,
}

export enum SKILL {
    LONG_BLADE,
    SHORT_BLADE,
    BLUNT,
    AXE,
    POLEARM,
    STAFF,
    BOW,
    CROSSBOW,
    SHIELD,
    UNARMORED,
    CLOTH_ARMOR,
    LEATHER_ARMOR,
    CHAIN_ARMOR,
    PLATE_ARMOR,
    IMPOSITION,
    INCANTATION,
    SIGILRY,
    SUPPLICATION,
    MANIFESTATION,
    CONVERSION,
    ATAVISM,
    ILLUSION,
    BENEDICTION,
    MALEDICTION,
    ENHANCEMENT,
    RESTORATION,
    ALTERATION,
    RECONFIGURATION,
    REORIENTATION,
    CONJURATION,
    SUMMONING,
    BINDING,
    REPUDIATION,
    PROPHECY,
    ALCHEMY,
    HERBALISM,
    BUTCHERING,
    PROSPECTING,
    SMELTING,
    SMITHING,
    ENCHANTING,
}

export enum RESOURCE {
    FLESH,
    BLOOD,
    BONE,
    SOUL,
    STAMINA,
    MANA,
}

export enum EQUIPMENT_SLOT {
    WEAPON = 0,
    SHIELD = 1,
    HELMET = 2,
    CHEST_ARMOR = 3,
    LEG_ARMOR = 4,
    BOOTS = 5,
    GLOVES = 6,
    BELT = 7,
    NECKLACE = 8,
    RING = 9,
    RING_ALT = 10,
}

export interface ArmorData {
    coverage: number;
    resilience: number;
    armor: number;
    slot: keyof typeof EQUIPMENT_SLOT;
}

export interface WeaponData {
    one_handed: boolean;
    piercing: number;
    sharpness: number;
    force: number;
    precision: number;
    speed: number;
    attack_animation: string;
}

export interface Item {
    id: string;
    name: string;
    sprite: string;
    stackable: boolean;
    count: number;
    armor_data?: ArmorData;
    weapon_data?: WeaponData;
}

export type Inventory = Item[];

export type CharacterEquipment = Record<keyof typeof EQUIPMENT_SLOT, Item>;

export type CharacterAttributes = Record<keyof typeof ATTRIBUTE, number>;

export type CharacterSkills = Record<keyof typeof SKILL, number>;

export interface CharacterTrait {
    id: string;
    buyable: boolean;
    cost: number;
    name: string;
    description: string;
    effects: any[];
}

export interface CharacterRace {
    raceID: string;
    name: string;
    description: string;
    playable: boolean;
    bodySize: string;
    baseAttributes: CharacterAttributes;
    traits: CharacterTrait[];
}

type Pools = Record<keyof typeof RESOURCE, { quantity: number, capacity: number }>

export interface CharacterStatus {
    action_points: number;
    max_action_points: number;
    action_point_recovery: number;
    pools: Pools;
}

export interface CharacterSheet {
    equipment: CharacterEquipment;
    race: CharacterRace;
    traits: CharacterTrait[];
    skills: CharacterSkills;
    status: CharacterStatus;
    allocatedAttributes: CharacterAttributes;
    essence: number;
    exp: number;
}

export interface Entity {
    id: string;
    location: Location;
    components: {
        direction?: keyof typeof DIRECTION;
        sheet?: any;
        sprite?: string;
        name?: string;
        inventory?: Inventory;
        portal?: unknown;
        item_data?: Item;
    }
    animation_playing?: string;
    animation_start_time?: number;
}

export interface Board {
    x: number;
    y: number;
    width: number;
    height: number;
    tiles: number[][];
    tileAdjacencies: number[][];
    fog_of_war: {
        width: number;
        height: number;
        visible: boolean[][];
    };
}
