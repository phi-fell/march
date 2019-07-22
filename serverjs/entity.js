(function () {
    var uuid = require('uuid/v4');
    function generateNewEntityID() {
        return uuid();
    }
    class Entity {
        constructor(name) {
            this.id = generateNewEntityID();
            this.name = name;
            this.health = 10;
        }
        _handleDeath() {
            //TODO: kill entity
        }
        _takeDirectHealthDamage(amount) {
            //take this damage directly to health and then account for effects (e.g. dying if health = 0 or whatever)
            //this functions is basically just health -= amount
            this.health -= amount;
            if (this.health <= 0) {
                this.handleDeath();
            }
        }
        _takeNetDamage(amount) {
            //apply this damage without accounting for armor, resistances, etc.
            //this function handles e.g. applying the damage first to a magical energy shield before actual health, or whatnot
            var shield = 0;//for example purposes.
            var netAmount = amount - sheild;
            sheild = 0;
            this.takeDirectHealthDamage(netAmount);
        }
        _takeDamage(amount) {
            //take amount damage, filtered through armor, resists, etc.
            var armor = 0;//for example purposes
            this.takeNetDamage(amount - armor);
        }
        hit(amount) {
            //take a hit, first applying chance to dodge, etc.
            var dodgeChance = 0;
            if (Math.random() >= dodgeChance) {
                this.takeDamage(amount);
            }
        }
    }
    module.exports = Entity;
}());