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
        this._tilesheet = undefined;
        this._tileset = [];
        this._subtiles = [];
        this._sprites = [];
        this._drawQueued = false;
        this._sheetdisplaymode = 'attributes';
        this._loadImages();
    }

    _loadImages() {
        const tileSize = 32;//width and height in pixels within sheet
        this._tilesheet = new Image();
        let g = this;
        this._tilesheet.onload = function () {
            let sheetSize = 10;//width and height of sheet in tiles
            for (var i = 0; i < 100; i++) {
                var tx = i % sheetSize;
                var ty = Math.floor(i / sheetSize);
                g._tileset[i] = document.createElement('canvas');
                let context = g._tileset[i].getContext('2d');
                g._tileset[i].width = tileSize;
                g._tileset[i].height = tileSize;
                context.drawImage(g._tilesheet, tx * tileSize, ty * tileSize, tileSize, tileSize, 0, 0, tileSize, tileSize);
            }
        }
        this._tilesheet.src = "tex/tilesheet.png";
        const MAX_TILE_ID = 5;
        for (let i = 0; i <= MAX_TILE_ID; i++) {
            let image = new Image();
            image.onload = function () {
                let st = [];
                for (let x = 0; x * tileSize < image.width; x++) {
                    st[x] = [];
                    for (let y = 0; y * tileSize < image.height; y++) {
                        st[x][y] = document.createElement('canvas');
                        let context = st[x][y].getContext('2d');
                        st[x][y].width = tileSize;
                        st[x][y].height = tileSize;
                        context.drawImage(image, x * tileSize, y * tileSize, tileSize, tileSize, 0, 0, tileSize, tileSize);
                    }
                }
                g._subtiles[i] = st;
            }
            image.src = "tex/tiles/" + i + ".png";
        }
        const MAX_SPRITE_ID = 2;
        for (let i = 0; i <= MAX_SPRITE_ID; i++) {
            this._sprites[i] = new Image();
            this._sprites[i].onload = function () {
                //do nothing for now.
            }
            this._sprites[i].src = "tex/sprites/" + i + ".png";
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
        var status = this.player.status;
        var list = $("#sheet");
        list.empty();
        list.append($('<li>').text('-----Character Sheet----- (change mode with /sheet)'));
        if (this._sheetdisplaymode === 'attributes' || this._sheetdisplaymode === 'attr') {
            let lvlupavailable = sheet.exp >= 10;
            list.append($('<li>').text('Body:'));
            list.append($('<li>').html(' - Strength: ' + sheet.attributes.STRENGTH + (lvlupavailable ? ' <button onclick="levelUpAttr(\'STRENGTH\')">+</button> (10 exp)' : '')));
            list.append($('<li>').html(' - Endurance: ' + sheet.attributes.ENDURANCE + (lvlupavailable ? ' <button onclick="levelUpAttr(\'ENDURANCE\')">+</button> (10 exp)' : '')));
            list.append($('<li>').html(' - Constitution: ' + sheet.attributes.CONSTITUTION + (lvlupavailable ? ' <button onclick="levelUpAttr(\'CONSTITUTION\')">+</button> (10 exp)' : '')));
            list.append($('<li>').text('Movement:'));
            list.append($('<li>').html(' - Agility: ' + sheet.attributes.AGILITY + (lvlupavailable ? ' <button onclick="levelUpAttr(\'AGILITY\')">+</button> (10 exp)' : '')));
            list.append($('<li>').html(' - Dexterity: ' + sheet.attributes.DEXTERITY + (lvlupavailable ? ' <button onclick="levelUpAttr(\'DEXTERITY\')">+</button> (10 exp)' : '')));
            list.append($('<li>').html(' - Speed: ' + sheet.attributes.SPEED + (lvlupavailable ? ' <button onclick="levelUpAttr(\'SPEED\')">+</button> (10 exp)' : '')));
            list.append($('<li>').text('Mental:'));
            list.append($('<li>').html(' - Charisma: ' + sheet.attributes.CHARISMA + (lvlupavailable ? ' <button onclick="levelUpAttr(\'CHARISMA\')">+</button> (10 exp)' : '')));
            list.append($('<li>').html(' - Logic: ' + sheet.attributes.LOGIC + (lvlupavailable ? ' <button onclick="levelUpAttr(\'LOGIC\')">+</button> (10 exp)' : '')));
            list.append($('<li>').html(' - Wisdom: ' + sheet.attributes.WISDOM + (lvlupavailable ? ' <button onclick="levelUpAttr(\'WISDOM\')">+</button> (10 exp)' : '')));
            list.append($('<li>').text('Other:'));
            list.append($('<li>').html(' - Memory: ' + sheet.attributes.MEMORY + (lvlupavailable ? ' <button onclick="levelUpAttr(\'MEMORY\')">+</button> (10 exp)' : '')));
            list.append($('<li>').html(' - Will: ' + sheet.attributes.WILLPOWER + (lvlupavailable ? ' <button onclick="levelUpAttr(\'WILLPOWER\')">+</button> (10 exp)' : '')));
            list.append($('<li>').html(' - Luck: ' + sheet.attributes.LUCK + (lvlupavailable ? ' <button onclick="levelUpAttr(\'LUCK\')">+</button> (10 exp)' : '')));
        } else {
            list.append($('<li>').text('Mode \"' + this._sheetdisplaymode + '\" does not exist'));
            list.append($('<li>').text('available modes:'));
            list.append($('<li>').text(' - attributes (shorthand: attr)'));
        }

        var list = $("#status");
        list.empty();
        list.append($('<li>').text('-----Status-----'));
        list.append($('<li>').text('Position: (' + this.player.location.x + ', ' + this.player.location.y + ")"));
        list.append($('<li>').text('Health: ' + status.hp + '/' + status.max_hp));
        list.append($('<li>').text('Stamina: ' + status.sp + '/' + status.max_sp));
        list.append($('<li>').text('Action Points: ' + status.ap + '/' + status.max_ap + ' (+' + status.ap_recovery + ' /turn)'));

        var list = $("#info");
        list.empty();
        list.append($('<li>').text('Player: ' + this.player.name));
        list.append($('<li>').text('Origin: ' + sheet.origin.type));
        list.append($('<li>').text('Exp: ' + sheet.exp));
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
                    switch (tile) {
                        case 3:
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
                            break;
                        case 0:
                        case 1:
                        case 2:
                            this._drawTile(tile, ((x - 1) * scale) + offsetX, ((y - 1) * scale) + offsetY, scale, scale);
                            break;
                        default:
                            this._drawTile(99, ((x - 1) * scale) + offsetX, ((y - 1) * scale) + offsetY, scale, scale);
                            break;
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
                this._ctx.drawImage(this._subtiles[id[1][1]][tx][ty], x + (w * i), y + (w * j), w, h);
            }
        }
    }

    _drawTile(id, x, y, w, h) {
        this._ctx.drawImage(this._tileset[id], x, y, w, h);
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