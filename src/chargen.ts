import { ACTION_STATUS, Entity } from './entity';
import { Instance, InstanceAttributes } from './instance';
import { INSTANCE_GEN_TYPE } from './instancegenerator';
import { getInstanceFromSchema } from './instanceschema';
import { Location } from './location';
import { Random } from './math/random';
import { getMobFromSchema } from './mobschema';
import { Player } from './player';
import { Portal } from './portal';
import { getTileFromName } from './tile';

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
        super(id, name, 'slime', location);
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
                const attr = new InstanceAttributes('', 10, 10, true);
                attr.genType = INSTANCE_GEN_TYPE.ONE_ROOM;
                const inst = Instance.spinUpNewInstance(attr);
                inst.spawnEntityAtCoords(new TextEntity(Entity.generateNewEntityID(), 'Use WASD to move', 'text'), 2, 1);
                inst.spawnEntityAtCoords(new TextEntity(Entity.generateNewEntityID(), 'Press Spacebar to Attack', 'text'), 5, 2);
                inst.spawnEntityAtCoords(new TextEntity(Entity.generateNewEntityID(), 'Use > to do down stairs', 'text'), 8, 3);
                const slime = getMobFromSchema('slime_tutorial');
                if (!slime) {
                    console.log('could not get Tutorial Slime schema!');
                } else {
                    slime.doNextAction = () => {
                        slime!.charSheet.status.action_points = 0;
                        return ACTION_STATUS.WAITING;
                    };
                    inst.spawnEntityAtCoords(slime, 6, 6);
                }
                inst.tiles[6][6] = getTileFromName('stone_stairs');
                inst.portals.push(new Portal(new Location(6, 6, inst.id), 'forest'));
                inst.spawnEntityAtCoords(player, 3, 8);
                break;
            }
            case CharGenStage.Done: {
                // TODO: spawn into main world?
                let inst = Instance.getAvailableNonFullInstance(player);
                if (!inst) {
                    inst = getInstanceFromSchema('forest', Random.uuid());
                    if (inst) {
                        if (!inst.spawnEntityNearCoords(player, Math.floor(inst.attributes.width / 2), Math.floor(inst.attributes.height / 2))) {
                            console.log('COULD NOT SPAWN PLAYER INTO INSTANCE NEAR LOCATION!');
                        }
                    }
                }
                if (!inst) {
                    const attr = new InstanceAttributes('ERROR', 10, 10, true);
                    attr.genType = INSTANCE_GEN_TYPE.ONE_ROOM;
                    inst = Instance.spinUpNewInstance(attr);
                    if (!inst.spawnEntityAnywhere(player)) {
                        console.log('COULD NOT SPAWN PLAYER INTO INSTANCE! ABORTING SPAWN.');
                    }
                }
                break;
            }
            default:
                console.log('ERROR! INVALID CHARGEN STAGE!');
                break;
        }
    }
}
