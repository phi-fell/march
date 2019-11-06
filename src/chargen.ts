import { ACTION_STATUS, Entity } from './entity';
import { Instance, InstanceAttributes } from './instance';
import { INSTANCE_GEN_TYPE } from './instancegenerator';
import { getInstanceFromSchema } from './instanceschema';
import { Location } from './location';
import { Random } from './math/random';
import { spawnMobFromSchema } from './mobschema';
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

export class CharGen {
    public static spawnPlayerInFreshInstance(player: Player) {
        switch (player.chargen) {
            case CharGenStage.Tutorial: {
                const attr = new InstanceAttributes(Random.getDeterministicID(), 10, 10, true);
                attr.genType = INSTANCE_GEN_TYPE.ONE_ROOM;
                const inst = new Instance(attr);
                const t1 = new TextEntity(Entity.generateNewEntityID(), 'Use WASD to move', 'text', new Location(2, 1, inst.id));
                const t2 = new TextEntity(Entity.generateNewEntityID(), 'Press Spacebar to Attack', 'text', new Location(5, 2, inst.id));
                const t3 = new TextEntity(Entity.generateNewEntityID(), 'Use > to do down stairs', 'text', new Location(8, 3, inst.id));
                const slime = spawnMobFromSchema('slime_tutorial', new Location(6, 6, inst.id));
                if (!slime) {
                    console.log('could not get Tutorial Slime schema!');
                }
                inst.spawnEntityAtCoords(player, 3, 8);
                break;
            }
            case CharGenStage.Done: {
                // TODO: spawn into main world?
                const inst = getInstanceFromSchema('forest', Random.uuid());
                if (inst && !inst.spawnEntityNearCoords(player, Math.floor(inst.attributes.width / 2), Math.floor(inst.attributes.height / 2))) {
                    console.log('COULD NOT SPAWN PLAYER INTO INSTANCE NEAR LOCATION!');
                }
                if (!inst) {
                    console.log('COULD NOT GENRATE INSTANCE! ABORTING SPAWN.');
                }
                break;
            }
            default:
                console.log('ERROR! INVALID CHARGEN STAGE!');
                break;
        }
    }
}
