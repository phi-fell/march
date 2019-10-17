import { ATTRIBUTE } from './character/characterattributes';
import { CharacterRace } from './character/characterrace';
import { ACTION_STATUS, Entity, SPRITE } from './entity';
import { Instance, InstanceAttributes } from './instance';
import { INSTANCE_GEN_TYPE } from './instancegenerator';
import { Location } from './location';
import { Player } from './player';

export const enum CharGenStage {
    Tutorial,
    Done,
}

class EnemyCount {
    constructor(public count: number) { }
}
class TextEntity extends Entity {
    public doNextAction(): ACTION_STATUS {
        this.charSheet.status.action_points = 0;
        return ACTION_STATUS.WAITING;
    }
}
class TutorialEnemy extends Entity {
    constructor(private player: Player, private count: EnemyCount, id: string, name: string, location: Location = new Location(0, 0, '')) {
        super(id, name, SPRITE.SLIME, location);
    }
    public doNextAction(): ACTION_STATUS {
        this.charSheet.status.action_points = 0;
        return ACTION_STATUS.WAITING;
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

export class CharGen {
    public static spawnPlayerInFreshInstance(player: Player) {
        switch (player.chargen) {
            case CharGenStage.Tutorial: {
                const attr = new InstanceAttributes(0, 10, 10, true);
                attr.genType = INSTANCE_GEN_TYPE.ONE_ROOM;
                const inst = Instance.spinUpNewInstance(attr);
                inst.spawnEntityAtCoords(new TextEntity(Entity.generateNewEntityID(), 'Use WASD to move', SPRITE.NAME), 2, 1);
                inst.spawnEntityAtCoords(new TextEntity(Entity.generateNewEntityID(), 'Move into an enemy to auto-attack', SPRITE.NAME), 5, 2);
                inst.spawnEntityAtCoords(new TextEntity(Entity.generateNewEntityID(), 'Destroy the enemy to Proceed', SPRITE.NAME), 8, 3);
                inst.spawnEntityAtCoords(new TutorialEnemy(player, new EnemyCount(1), Entity.generateNewEntityID(), 'Enemy'), 6, 6);
                inst.spawnEntityAtCoords(player, 3, 8);
                break;
            }
            case CharGenStage.Done: {
                // TODO: spawn into main world?
                let inst = Instance.getAvailableNonFullInstance(player);
                if (!inst) {
                    const attr = new InstanceAttributes(0, 100, 100);
                    attr.genType = INSTANCE_GEN_TYPE.BASIC_DUNGEON;
                    inst = Instance.spinUpNewInstance(attr);
                    for (let i = 0; i < 100; i++) {
                        let posX: number;
                        let posY: number;
                        const ent = new Entity(Entity.generateNewEntityID(), 'Slime ' + i, SPRITE.SLIME);
                        ent.charSheet.race = new CharacterRace('slime');
                        ent.charSheet.addExperience(1);
                        ent.charSheet.levelUpAttribute(ATTRIBUTE.STRENGTH);
                        do {
                            posX = Math.floor(Math.random() * inst.attributes.width);
                            posY = Math.floor(Math.random() * inst.attributes.height);
                        } while (!inst.spawnEntityAtCoords(ent, posX, posY));
                    }
                }
                let posX;
                let posY;
                let attempts = 0;
                do {
                    posX = Math.floor(Math.random() * inst.attributes.width);
                    posY = Math.floor(Math.random() * inst.attributes.height);
                    attempts++;
                } while (attempts < 1000 && !inst.spawnEntityAtCoords(player, posX, posY));
                if (attempts === 1000) {
                    console.log('COULD NOT SPAWN PLAYER INTO INSTANCE AFTER 1000 ATTEMPTS! ABORTING SPAWN.');
                }
                break;
            }
            default:
                console.log('ERROR! INVALID CHARGEN STAGE!');
                break;
        }
    }
}
