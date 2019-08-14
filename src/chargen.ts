import { Player } from "./player";
import { Instance, InstanceAttributes } from "./instance";
import { Entity } from "./entity";
import { Location } from "./location";

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
    constructor(private player: Player, private origin: string, id: string, name: string, location: Location = new Location(0, 0, '')) {
        super(id, name, location)
        this.status.hp = 1;
    }
    protected handleDeath() {
        super.handleDeath();
        this.player.chargen++;
        this.player.origin = this.origin;
        Instance.removeEntityFromWorld(this.player);
        CharGen.spawnPlayerInFreshInstance(this.player);

    }
}

export class CharGen {
    static spawnPlayerInFreshInstance(player: Player) {
        switch (player.chargen) {
            case CharGenStage.Tutorial:
                var inst = Instance.spinUpNewInstance(new InstanceAttributes(0, 10, 10, true));
                inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Use WASD to move'), 2, 1);
                inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Move into an enemy to auto-attack'), 5, 2);
                inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Destroy the enemy to Proceed'), 8, 3);
                inst.spawnEntityAtCoords(new TutorialEnemy(player, new EnemyCount(1), Entity.generateNewEntityID(), 'Enemy'), 6, 6);
                inst.spawnEntityAtCoords(player, 3, 8);
                break;
            case CharGenStage.Name:
                var inst = Instance.spinUpNewInstance(new InstanceAttributes(0, 10, 10, true));
                inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Change your name with /name'), 2, 1);
                inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Destroy all enemies to Proceed'), 6, 1);
                var count: EnemyCount = new EnemyCount(3);
                inst.spawnEntityAtCoords(new TutorialEnemy(player, count, Entity.generateNewEntityID(), 'Enemy'), 0, 5);
                inst.spawnEntityAtCoords(new TutorialEnemy(player, count, Entity.generateNewEntityID(), 'Enemy'), 5, 5);
                inst.spawnEntityAtCoords(new TutorialEnemy(player, count, Entity.generateNewEntityID(), 'Enemy'), 9, 5);
                inst.spawnEntityAtCoords(player, 5, 8);
                break;
            case CharGenStage.Origin:
                //TODO: create origin selection instance
                var inst = Instance.spinUpNewInstance(new InstanceAttributes(0, 10, 10, true));
                inst.spawnEntityAtCoords(new Entity(Entity.generateNewEntityID(), 'Choose An Origin'), 4, 1);
                inst.spawnEntityAtCoords(new OriginEnemy(player, "Blooded", Entity.generateNewEntityID(), 'Blooded Redvein'), 1, 3);
                inst.spawnEntityAtCoords(new OriginEnemy(player, "Neathling", Entity.generateNewEntityID(), 'Neathling'), 3, 3);
                inst.spawnEntityAtCoords(new OriginEnemy(player, "Avrilen", Entity.generateNewEntityID(), 'Avrilen'), 5, 3);
                inst.spawnEntityAtCoords(new OriginEnemy(player, "Marrow", Entity.generateNewEntityID(), 'Marrow Fallen'), 7, 3);
                inst.spawnEntityAtCoords(player, 4, 8);
                break;
            case CharGenStage.Done:
                //TODO: spawn into main world?
                var inst = Instance.getAvailableNonFullInstance(player);
                if (!inst) {
                    inst = Instance.spinUpNewInstance(new InstanceAttributes(0, 100, 100));
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