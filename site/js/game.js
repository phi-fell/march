const TILE_SIZE = 32; // width and height in pixels

class Game {
    constructor(canvas) {
        this._width = canvas.clientWidth;
        this._height = canvas.clientHeight;
        canvas.width = this._width;
        canvas.height = this._height;
        this._ctx = canvas.getContext('2d');
        this._ctx.font = "bold 12px Arial";
        this._ctx.strokeStyle = "#FFF";
        this._ctx.fillStyle = "#FFF";
        this._ctx.imageSmoothingEnabled = false;
        this.mobs = undefined;
        this.tiles = undefined;
        this.boardInfo = undefined;
        this.player = undefined;
        this._palette = [];
        this._sprites = [];
        this._drawQueued = false;
        this._sheetdisplaymode = 'attributes';
        this._loadImages();
    }

    _loadImages() {
        let g = this;
        const MAX_SPRITE_ID = 2;
        for (let i = 0; i <= MAX_SPRITE_ID; i++) {
            this._sprites[i] = new Image();
            this._sprites[i].onload = function () {
                //do nothing for now.
            }
            this._sprites[i].src = "tex/sprites/" + i + ".png";
        }
    }

    loadPalette(palette) {
        let g = this;
        {
            g._palette[-1] = {
                "sheet": false,
                "image": null,
            };
            g._palette[-2] = {
                "sheet": false,
                "image": null,
            };
            let no_image = new Image();
            let error_image = new Image();
            no_image.onload = function () {
                g._palette[-1].image = no_image;
            }
            error_image.onload = function () {
                g._palette[-2].image = error_image;
            }
            no_image.src = "tex/tiles/none.png";
            error_image.src = "tex/tiles/error.png";
        }
        for (let i = 0; i < palette.length; i++) {
            let image = new Image();
            image.onload = function () {
                if (image.width === TILE_SIZE && image.height === TILE_SIZE) {
                    g._palette[i] = {
                        "sheet": false,
                        "image": image,
                    };
                } else {
                    let st = [];
                    for (let x = 0; x * TILE_SIZE < image.width; x++) {
                        st[x] = [];
                        for (let y = 0; y * TILE_SIZE < image.height; y++) {
                            st[x][y] = document.createElement('canvas');
                            let context = st[x][y].getContext('2d');
                            st[x][y].width = TILE_SIZE;
                            st[x][y].height = TILE_SIZE;
                            context.drawImage(image, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE, 0, 0, TILE_SIZE, TILE_SIZE);
                        }
                    }
                    g._palette[i] = {
                        "sheet": true,
                        "subtiles": st,
                    };
                }
                g.draw();
            }
            image.onerror = function () {
                g._palette[i] = g._palette[-2];
            }
            image.src = "tex/tiles/" + palette[i] + ".png";
        }
    }

    draw() {
        if (this._drawQueued) {
            return;//draw will happen anyway
        } else {
            this._drawQueued = true;
            setTimeout(() => {
                this._drawQueued = false;
                this._draw();
            }, 50);
        }
    }

    updateMenus() {
        var sheet = this.player.sheet;
        var list = $("#sheet");
        list.empty();
        if (this._sheetdisplaymode === 'attributes' || this._sheetdisplaymode === 'attr') {
            let lvlupavailable = sheet.exp >= 10;
            list.append($('<li>').text('Body:'));
            list.append($('<li>').html(' - Strength: ' + sheet.attributes.STRENGTH + ((sheet.exp >= sheet.attributeLevelupCosts.STRENGTH) ? ' <button onclick="levelUpAttr(\'STRENGTH\')">+</button> (' + sheet.attributeLevelupCosts.STRENGTH + 'exp)' : '')));
            list.append($('<li>').html(' - Endurance: ' + sheet.attributes.ENDURANCE + ((sheet.exp >= sheet.attributeLevelupCosts.ENDURANCE) ? ' <button onclick="levelUpAttr(\'ENDURANCE\')">+</button> (' + sheet.attributeLevelupCosts.ENDURANCE + 'exp)' : '')));
            list.append($('<li>').html(' - Vitality: ' + sheet.attributes.VITALITY + ((sheet.exp >= sheet.attributeLevelupCosts.VITALITY) ? ' <button onclick="levelUpAttr(\'VITALITY\')">+</button> (' + sheet.attributeLevelupCosts.VITALITY + 'exp)' : '')));
            list.append($('<li>').text('Movement:'));
            list.append($('<li>').html(' - Agility: ' + sheet.attributes.AGILITY + ((sheet.exp >= sheet.attributeLevelupCosts.AGILITY) ? ' <button onclick="levelUpAttr(\'AGILITY\')">+</button> (' + sheet.attributeLevelupCosts.AGILITY + 'exp)' : '')));
            list.append($('<li>').html(' - Dexterity: ' + sheet.attributes.DEXTERITY + ((sheet.exp >= sheet.attributeLevelupCosts.DEXTERITY) ? ' <button onclick="levelUpAttr(\'DEXTERITY\')">+</button> (' + sheet.attributeLevelupCosts.DEXTERITY + 'exp)' : '')));
            list.append($('<li>').html(' - Speed: ' + sheet.attributes.SPEED + ((sheet.exp >= sheet.attributeLevelupCosts.SPEED) ? ' <button onclick="levelUpAttr(\'SPEED\')">+</button> (' + sheet.attributeLevelupCosts.SPEED + 'exp)' : '')));
            list.append($('<li>').text('Mental:'));
            list.append($('<li>').html(' - Charisma: ' + sheet.attributes.CHARISMA + ((sheet.exp >= sheet.attributeLevelupCosts.CHARISMA) ? ' <button onclick="levelUpAttr(\'CHARISMA\')">+</button> (' + sheet.attributeLevelupCosts.CHARISMA + 'exp)' : '')));
            list.append($('<li>').html(' - Logic: ' + sheet.attributes.LOGIC + ((sheet.exp >= sheet.attributeLevelupCosts.LOGIC) ? ' <button onclick="levelUpAttr(\'LOGIC\')">+</button> (' + sheet.attributeLevelupCosts.LOGIC + 'exp)' : '')));
            list.append($('<li>').html(' - Intuition: ' + sheet.attributes.INTUITION + ((sheet.exp >= sheet.attributeLevelupCosts.INTUITION) ? ' <button onclick="levelUpAttr(\'INTUITION\')">+</button> (' + sheet.attributeLevelupCosts.INTUITION + 'exp)' : '')));
            list.append($('<li>').text('Other:'));
            list.append($('<li>').html(' - Perception: ' + sheet.attributes.PERCEPTION + ((sheet.exp >= sheet.attributeLevelupCosts.PERCEPTION) ? ' <button onclick="levelUpAttr(\'PERCEPTION\')">+</button> (' + sheet.attributeLevelupCosts.PERCEPTION + 'exp)' : '')));
            list.append($('<li>').html(' - Will: ' + sheet.attributes.WILL + ((sheet.exp >= sheet.attributeLevelupCosts.WILL) ? ' <button onclick="levelUpAttr(\'WILL\')">+</button> (' + sheet.attributeLevelupCosts.WILL + 'exp)' : '')));
            list.append($('<li>').html(' - Luck: ' + sheet.attributes.LUCK + ((sheet.exp >= sheet.attributeLevelupCosts.LUCK) ? ' <button onclick="levelUpAttr(\'LUCK\')">+</button> (' + sheet.attributeLevelupCosts.LUCK + 'exp)' : '')));
        } else if (this._sheetdisplaymode === 'race') {
            list.append($('<li>').text('Race: ' + sheet.race.name));
            list.append($('<li>').text(sheet.race.description));
        } else {
            list.append($('<li>').text('Mode \"' + this._sheetdisplaymode + '\" does not exist'));
            list.append($('<li>').text('available modes:'));
            list.append($('<li>').text(' - attributes (shorthand: attr)'));
        }

        var list = $("#status");
        list.empty();
        list.append($('<li>').text('-----Status-----'));
        list.append($('<li>').text('Position: (' + this.player.location.x + ', ' + this.player.location.y + ")"));
        if (sheet.status.FLESH) {
            list.append($('<li>').text('Flesh: ' + sheet.status.FLESH.quantity + '/' + sheet.status.FLESH.capacity));
        }
        if (sheet.status.BLOOD) {
            list.append($('<li>').text('Blood: ' + sheet.status.BLOOD.quantity + '/' + sheet.status.BLOOD.capacity));
        }
        if (sheet.status.BONE) {
            list.append($('<li>').text('Bone: ' + sheet.status.BONE.quantity + '/' + sheet.status.BONE.capacity));
        }
        if (sheet.status.SOUL) {
            list.append($('<li>').text('Soul: ' + sheet.status.SOUL.quantity + '/' + sheet.status.SOUL.capacity));
        }
        if (sheet.status.MANA) {
            list.append($('<li>').text('Mana: ' + sheet.status.MANA.quantity + '/' + sheet.status.MANA.capacity));
        }
        if (sheet.status.STAMINA) {
            list.append($('<li>').text('Stamina: ' + sheet.status.STAMINA.quantity + '/' + sheet.status.STAMINA.capacity));
        }
        list.append($('<li>').text('Action Points: ' + sheet.status.action_points + '/' + sheet.status.max_action_points + ' (+' + sheet.status.action_point_recovery + ' /turn)'));
        let weapon_hover = (sheet.equipment.weapon.one_handed ? 'One Handed' : 'Two Handed') + '\n' + "piercing: " + sheet.equipment.weapon.piercing + "\n" + "sharpness: " + sheet.equipment.weapon.sharpness + "\n" + "force: " + sheet.equipment.weapon.force + "\n" + "precision: " + sheet.equipment.weapon.precision + "\n" + "speed: " + sheet.equipment.weapon.speed;
        list.append($('<li>').html('Weapon: <span title="' + weapon_hover + '"><b>[' + sheet.equipment.weapon.name + ']</b></span>'));

        var list = $("#info");
        list.empty();
        list.append($('<li>').text('Player: ' + this.player.name));
        list.append($('<li>').text('Race: ' + sheet.race.name));
        list.append($('<li>').text('Essence: ' + sheet.exp));
        switch (this.player.action.type) {
            case 'NONE':
            case 'WAIT':
            case 'UNWAIT':
                list.append($('<li>').text('Action: ' + this.player.action.type));
                break;
            case 'MOVE':
                list.append($('<li>').text('Action: ' + this.player.action.type + " " + this.player.action.direction));
                break;
            default:
                list.append($('<li>').text('Action: UNKNOWN ACTION TYPE!'));
                break;
        }
        list.append($('<li>').text(this.boardInfo.your_turn ? 'It\'s your turn!' : 'Other characters are taking their turn...'));
    }

    _draw() {
        this._clear();
        this._drawBoard();
        if (this.tiles !== undefined) {
            this._ctx.textBaseline = 'middle';
            this._ctx.textAlign = "center";
            var scaleX = this._width / (this.tiles.length - 2);
            var scaleY = this._height / (this.tiles[0].length - 2);
            var scale = Math.max(scaleX, scaleY);
            var offsetX = 0;
            var offsetY = 0;
            if (this._width < this._height) {
                offsetX = (this._width - this._height) / 2;
            } else if (this._height < this._width) {
                offsetY = (this._height - this._width) / 2;
            }
            for (var x = 1; x < this.tiles.length - 1; x++) {
                for (var y = 1; y < this.tiles[0].length - 1; y++) {
                    let tile = this.tiles[x][y];
                    if (tile >= this._palette.length) {
                        tile = -2; // use error texture
                    }
                    if (this._palette[tile].sheet) {
                        let ids = [
                            [0, 0, 0],
                            [0, tile, 0],
                            [0, 0, 0],
                        ];
                        for (let i = -1; i <= 1; i++) {
                            for (let j = -1; j <= 1; j++) {
                                if (i != 0 || j != 0) {
                                    ids[i + 1][j + 1] = this.tiles[x + i][y + j];
                                }
                            }
                        }
                        this._drawSubtiles(ids, ((x - 1) * scale) + offsetX, ((y - 1) * scale) + offsetY, scale, scale);
                    } else {
                        this._drawTile(tile, ((x - 1) * scale) + offsetX, ((y - 1) * scale) + offsetY, scale, scale);
                    }
                }
            }
            for (let i = 0; i < this.mobs.length; i++) {
                let sprite = this.mobs[i].sprite;
                let x = this.mobs[i].location.x - this.boardInfo.x;
                let y = this.mobs[i].location.y - this.boardInfo.y;
                if (sprite == -1) {
                    //this._drawSquare(((x - 1) * scale) + offsetX, ((y - 1) * scale) + offsetY, scale, scale);
                    this._ctx.fillText(this.mobs[i].name, ((x - 0.5) * scale) + offsetX, ((y - 0.5) * scale) + offsetY);
                } else {
                    this._drawSprite(sprite, ((x - 1) * scale) + offsetX, ((y - 1) * scale) + offsetY, scale, scale);
                    this._ctx.fillText(this.mobs[i].sheet.status.action_points + '/' + this.mobs[i].sheet.status.max_action_points + ' (+' + this.mobs[i].sheet.status.action_point_recovery + ')', ((x - 0.5) * scale) + offsetX, ((y - 0.5) * scale) + offsetY);
                }
            }
        }
    }

    _drawSubtiles(id, x, y, w_2, h_2) {
        let w = w_2 / 2;
        let h = h_2 / 2;
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                let xi = i * 2;
                let yi = j * 2;
                let tx = 0;
                let ty = 0
                if (id[xi][yi] == id[1][1] && id[xi][1] == id[1][1] && id[1][yi] == id[1][1]) {
                    tx = 5; ty = 1;//surrounded
                } else if (id[xi][1] != id[1][1] && id[1][yi] != id[1][1]) {
                    tx = 2 + i; ty = j;//convex corner
                } else if (id[xi][1] == id[1][1] && id[1][yi] == id[1][1]) {
                    tx = i; ty = j;//concave corner
                } else if (id[xi][1] != id[1][1]) {
                    tx = 5 + i;//vertical wall
                } else {
                    tx = 4; ty = j//horizontal wall
                }
                this._ctx.drawImage(this._palette[id[1][1]].subtiles[tx][ty], x + (w * i), y + (w * j), w, h);
            }
        }
    }

    _drawTile(id, x, y, w, h) {
        this._ctx.drawImage(this._palette[id].image, x, y, w, h);
    }

    _drawSprite(id, x, y, w, h) {
        this._ctx.drawImage(this._sprites[id], x, y, w, h);
    }

    _drawSquare(x, y, w, h) {
        this._ctx.beginPath();
        this._ctx.rect(x, y, w, h);
        this._ctx.stroke();
    }

    _drawBoard() {
        this._ctx.beginPath();
        this._ctx.rect(0, 0, this._width, this._height);
        this._ctx.stroke();
    }

    _clear() {
        this._ctx.clearRect(0, 0, this._width, this._height);
    }
}

var game = new Game(document.getElementById('gameCanvas'));