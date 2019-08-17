import { Player } from "./player";
import { Instance, InstanceAttributes } from "./instance";
import { Entity } from "./entity";
import { Location } from "./location";
import { ORIGIN, CharacterOrigin } from "./characterorigin";
import { INSTANCE_GEN_TYPE } from "./instancegenerator";

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
        super(id, name, location)
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
        super(id, name, location)
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
    static spawnPlayerInFreshInstance(player: Player) {
        switch (player.chargen) {
            case CharGenStage.Tutorial:
                var attr = new InstanceAttributes(0, 10, 10, true);
                attr.genType = INSTANCE_GEN_TYPE.ONE_ROOM;
                var inst = Instance.spinUpNewInstance(attr);
                inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Use WASD to move'), 2, 1);
                inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Move into an enemy to auto-attack'), 5, 2);
                inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Destroy the enemy to Proceed'), 8, 3);
                inst.spawnEntityAtCoords(new TutorialEnemy(player, new EnemyCount(1), Entity.generateNewEntityID(), 'Enemy'), 6, 6);
                inst.spawnEntityAtCoords(player, 3, 8);
                break;
            case CharGenStage.Name:
                var attr = new InstanceAttributes(0, 10, 10, true);
                attr.genType = INSTANCE_GEN_TYPE.ONE_ROOM;
                var inst = Instance.spinUpNewInstance(attr);
                inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Change your name with /name'), 2, 1);
                inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Destroy all enemies to Proceed'), 6, 1);
                var count: EnemyCount = new EnemyCount(3);
                inst.spawnEntityAtCoords(new TutorialEnemy(player, count, Entity.generateNewEntityID(), 'Enemy'), 0, 5);
                inst.spawnEntityAtCoords(new TutorialEnemy(player, count, Entity.generateNewEntityID(), 'Enemy'), 5, 5);
                inst.spawnEntityAtCoords(new TutorialEnemy(player, count, Entity.generateNewEntityID(), 'Enemy'), 9, 5);
                inst.spawnEntityAtCoords(player, 5, 8);
                break;
            case CharGenStage.Origin:
                var attr = new InstanceAttributes(0, 10, 10, true);
                attr.genType = INSTANCE_GEN_TYPE.ONE_ROOM;
                var inst = Instance.spinUpNewInstance(attr);
                inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Choose An Origin'), 4, 1);
                inst.spawnEntityAtCoords(new OriginEnemy(player, ORIGIN.BLOODED, Entity.generateNewEntityID(), 'Blooded Redvein'), 1, 3);
                inst.spawnEntityAtCoords(new OriginEnemy(player, ORIGIN.NEATHLING, Entity.generateNewEntityID(), 'Neathling Outcast'), 3, 3);
                inst.spawnEntityAtCoords(new OriginEnemy(player, ORIGIN.AVRILEN, Entity.generateNewEntityID(), 'Avrilen Wanderer'), 5, 3);
                inst.spawnEntityAtCoords(new OriginEnemy(player, ORIGIN.MARROW, Entity.generateNewEntityID(), 'Marrow Fallen'), 7, 3);
                inst.spawnEntityAtCoords(player, 4, 8);
                break;
            case CharGenStage.Done:
                //TODO: spawn into main world?
                var inst = Instance.getAvailableNonFullInstance(player);
                if (!inst) {
                    var attr = new InstanceAttributes(0, 100, 100);
                    attr.genType = INSTANCE_GEN_TYPE.ROOMS;
                    inst = Instance.spinUpNewInstance(attr);
                    for (var i = 0; i < 100; i++) {
                        do {
                            var posX = Math.floor(Math.random() * inst.attributes.width);
                            var posY = Math.floor(Math.random() * inst.attributes.height);
                        } while (inst.board[posX][posY] !== undefined);
                        inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Orc ' + i), posX, posY);
                    }
                }
                do {
                    var posX = Math.floor(Math.random() * inst.attributes.width);
                    var posY = Math.floor(Math.random() * inst.attributes.height);
                } while (inst.board[posX][posY] !== undefined);
                inst.spawnEntityAtCoords(player, posX, posY);
                break;
            default:
                console.log('ERROR! INVALID CHARGEN STAGE!');
                break;
        }
    }
}