import { CharacterOrigin, ORIGIN } from './characterorigin';
import { Entity, SPRITE } from './entity';
import { Instance, InstanceAttributes } from './instance';
import { INSTANCE_GEN_TYPE } from './instancegenerator';
import { Location } from './location';
import { Player } from './player';

export const enum CharGenStage {
    Tutorial,
    Name,
    Origin,
    Done,
}

class EnemyCount {
    constructor(public count: number) { }
}
class TutorialEnemy extends Entity {
    constructor(private player: Player, private count: EnemyCount, id: string, name: string, location: Location = new Location(0, 0, '')) {
        super(id, name, SPRITE.SLIME, location);
        this.status.hp = 1;
    }
    protected handleDeath() {
        super.handleDeath();
        this.count.count--;
        if (this.count.count <= 0) {
            this.player.chargen++;
            Instance.removeEntityFromWorld(this.player);
            CharGen.spawnPlayerInFreshInstance(this.player);
        }
    }
}
class OriginEnemy extends Entity {
    constructor(private player: Player, private origin: ORIGIN, id: string, name: string, location: Location = new Location(0, 0, '')) {
        super(id, name, SPRITE.NAME, location);
        this.status.hp = 1;
    }
    protected handleDeath() {
        super.handleDeath();
        this.player.chargen++;
        this.player.charSheet.origin = new CharacterOrigin(this.origin);
        Instance.removeEntityFromWorld(this.player);
        CharGen.spawnPlayerInFreshInstance(this.player);
    }
}

export class CharGen {
    public static spawnPlayerInFreshInstance(player: Player) {
        switch (player.chargen) {
            case CharGenStage.Tutorial: {
                const attr = new InstanceAttributes(0, 10, 10, true);
                attr.genType = INSTANCE_GEN_TYPE.ONE_ROOM;
                const inst = Instance.spinUpNewInstance(attr);
                inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Use WASD to move', SPRITE.NAME), 2, 1);
                inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Move into an enemy to auto-attack', SPRITE.NAME), 5, 2);
                inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Destroy the enemy to Proceed', SPRITE.NAME), 8, 3);
                inst.spawnEntityAtCoords(new TutorialEnemy(player, new EnemyCount(1), Entity.generateNewEntityID(), 'Enemy'), 6, 6);
                inst.spawnEntityAtCoords(player, 3, 8);
                break;
            }
            case CharGenStage.Name: {
                const attr = new InstanceAttributes(0, 10, 10, true);
                attr.genType = INSTANCE_GEN_TYPE.ONE_ROOM;
                const inst = Instance.spinUpNewInstance(attr);
                inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Change your name with /name', SPRITE.NAME), 2, 1);
                inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Destroy all enemies to Proceed', SPRITE.NAME), 6, 1);
                const count: EnemyCount = new EnemyCount(3);
                inst.spawnEntityAtCoords(new TutorialEnemy(player, count, Entity.generateNewEntityID(), 'Enemy'), 0, 5);
                inst.spawnEntityAtCoords(new TutorialEnemy(player, count, Entity.generateNewEntityID(), 'Enemy'), 5, 5);
                inst.spawnEntityAtCoords(new TutorialEnemy(player, count, Entity.generateNewEntityID(), 'Enemy'), 9, 5);
                inst.spawnEntityAtCoords(player, 5, 8);
                break;
            }
            case CharGenStage.Origin: {
                const attr = new InstanceAttributes(0, 10, 10, true);
                attr.genType = INSTANCE_GEN_TYPE.ONE_ROOM;
                const inst = Instance.spinUpNewInstance(attr);
                inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Choose An Origin', SPRITE.NAME), 4, 1);
                inst.spawnEntityAtCoords(new OriginEnemy(player, ORIGIN.BLOODED, Entity.generateNewEntityID(), 'Blooded Redvein'), 1, 3);
                inst.spawnEntityAtCoords(new OriginEnemy(player, ORIGIN.NEATHLING, Entity.generateNewEntityID(), 'Neathling Outcast'), 3, 3);
                inst.spawnEntityAtCoords(new OriginEnemy(player, ORIGIN.AVRILEN, Entity.generateNewEntityID(), 'Avrilen Wanderer'), 5, 3);
                inst.spawnEntityAtCoords(new OriginEnemy(player, ORIGIN.MARROW, Entity.generateNewEntityID(), 'Marrow Fallen'), 7, 3);
                inst.spawnEntityAtCoords(player, 4, 8);
                break;
            }
            case CharGenStage.Done: {
                // TODO: spawn into main world?
                let inst = Instance.getAvailableNonFullInstance(player);
                if (!inst) {
                    const attr = new InstanceAttributes(0, 100, 100);
                    attr.genType = INSTANCE_GEN_TYPE.ROOMS;
                    inst = Instance.spinUpNewInstance(attr);
                    for (let i = 0; i < 100; i++) {
                        let posX: number;
                        let posY: number;
                        do {
                            posX = Math.floor(Math.random() * inst.attributes.width);
                            posY = Math.floor(Math.random() * inst.attributes.height);
                        } while (!inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Slime ' + i, SPRITE.SLIME), posX, posY));
                    }
                }
                let posX;
                let posY;
                do {
                    posX = Math.floor(Math.random() * inst.attributes.width);
                    posY = Math.floor(Math.random() * inst.attributes.height);
                } while (!inst.spawnEntityAtCoords(player, posX, posY));
                break;
            }
            default:
                console.log('ERROR! INVALID CHARGEN STAGE!');
                break;
        }
    }
}
