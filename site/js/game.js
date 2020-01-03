const TILE_SIZE = 32; // width and height in pixels

class Game {
    constructor(canvas) {
        //setup canvas
        this._width = canvas.clientWidth;
        this._height = canvas.clientHeight;
        canvas.width = this._width;
        canvas.height = this._height;
        this._ctx = canvas.getContext('2d');
        this._ctx.font = "bold 12px Arial";
        this._ctx.strokeStyle = "#FFF";
        this._ctx.fillStyle = "#FFF";
        this._ctx.imageSmoothingEnabled = false;
        //game data
        this.game_data_version = -1;
        this.game_data = {};
        this.game_data.mobs = {}
        //old game data [DEPRECATED]
        this.items = [];
        this.itemsOnGround = [];
        this.portals = [];
        this.tiles = undefined;
        this.tileAdjacencies = undefined;
        this.boardInfo = undefined;
        this.player = undefined;
        //resources
        this._palette = [];
        this._sprites = {};
        //UI data
        this._sheetdisplaymode = 'attributes';
        //load resources
        this._loadImages();
    }

    _getSprite(id) {
        if (this._sprites[id]) {
            return this._sprites[id];
        } else {
            this._loadSprite(id);
            return this._sprites['error'];
        }
    }

    _loadSprite(id) {
        this._sprites[id] = this._sprites['error'];
        let g = this;
        let img = new Image();
        img.onload = function () {
            g._sprites[id] = img;
            g.draw();
        }
        img.src = "tex/sprites/" + id + ".png";

    }

    _loadImages() {
        let g = this;
        this._sprites['error'] = new Image();
        this._sprites['error'].onload = function () {
            //do nothing for now.
        }
        this._sprites['error'].onerror = function () {
            console.log('default sprite could not be loaded!')
        }
        this._sprites['error'].src = "tex/sprites/error.png";
    }

    getData(id) {
        let ids = id.split(".");
        let obj = this.game_data;
        while (ids.length && (obj = obj[ids.shift()]));
        return obj;
    }

    setData(id, value) {
        let ids = id.split(".");
        let obj = this.game_data;
        while ((ids.length - 1) && (obj = obj[ids.shift()]));
        obj[ids[0]] = value;
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
        this._draw();
    }

    updateMenus() {
        var sheet = this.player.sheet;
        var list = $("#sheet");
        list.empty();
        if (this._sheetdisplaymode === 'attributes' || this._sheetdisplaymode === 'attr') {
            let lvlupavailable = sheet.essence >= 10;
            list.append($('<li>').text('Body:'));
            list.append($('<li>').html(' - Strength: ' + sheet.attributes.STRENGTH + ((sheet.essence >= sheet.attributeLevelupCosts.STRENGTH) ? ' <button onclick="levelUpAttr(\'STRENGTH\')">+</button> (' + sheet.attributeLevelupCosts.STRENGTH + 'essence)' : '')));
            list.append($('<li>').html(' - Endurance: ' + sheet.attributes.ENDURANCE + ((sheet.essence >= sheet.attributeLevelupCosts.ENDURANCE) ? ' <button onclick="levelUpAttr(\'ENDURANCE\')">+</button> (' + sheet.attributeLevelupCosts.ENDURANCE + 'essence)' : '')));
            list.append($('<li>').html(' - Vitality: ' + sheet.attributes.VITALITY + ((sheet.essence >= sheet.attributeLevelupCosts.VITALITY) ? ' <button onclick="levelUpAttr(\'VITALITY\')">+</button> (' + sheet.attributeLevelupCosts.VITALITY + 'essence)' : '')));
            list.append($('<li>').text('Movement:'));
            list.append($('<li>').html(' - Agility: ' + sheet.attributes.AGILITY + ((sheet.essence >= sheet.attributeLevelupCosts.AGILITY) ? ' <button onclick="levelUpAttr(\'AGILITY\')">+</button> (' + sheet.attributeLevelupCosts.AGILITY + 'essence)' : '')));
            list.append($('<li>').html(' - Dexterity: ' + sheet.attributes.DEXTERITY + ((sheet.essence >= sheet.attributeLevelupCosts.DEXTERITY) ? ' <button onclick="levelUpAttr(\'DEXTERITY\')">+</button> (' + sheet.attributeLevelupCosts.DEXTERITY + 'essence)' : '')));
            list.append($('<li>').html(' - Speed: ' + sheet.attributes.SPEED + ((sheet.essence >= sheet.attributeLevelupCosts.SPEED) ? ' <button onclick="levelUpAttr(\'SPEED\')">+</button> (' + sheet.attributeLevelupCosts.SPEED + 'essence)' : '')));
            list.append($('<li>').text('Mental:'));
            list.append($('<li>').html(' - Charisma: ' + sheet.attributes.CHARISMA + ((sheet.essence >= sheet.attributeLevelupCosts.CHARISMA) ? ' <button onclick="levelUpAttr(\'CHARISMA\')">+</button> (' + sheet.attributeLevelupCosts.CHARISMA + 'essence)' : '')));
            list.append($('<li>').html(' - Logic: ' + sheet.attributes.LOGIC + ((sheet.essence >= sheet.attributeLevelupCosts.LOGIC) ? ' <button onclick="levelUpAttr(\'LOGIC\')">+</button> (' + sheet.attributeLevelupCosts.LOGIC + 'essence)' : '')));
            list.append($('<li>').html(' - Intuition: ' + sheet.attributes.INTUITION + ((sheet.essence >= sheet.attributeLevelupCosts.INTUITION) ? ' <button onclick="levelUpAttr(\'INTUITION\')">+</button> (' + sheet.attributeLevelupCosts.INTUITION + 'essence)' : '')));
            list.append($('<li>').text('Other:'));
            list.append($('<li>').html(' - Perception: ' + sheet.attributes.PERCEPTION + ((sheet.essence >= sheet.attributeLevelupCosts.PERCEPTION) ? ' <button onclick="levelUpAttr(\'PERCEPTION\')">+</button> (' + sheet.attributeLevelupCosts.PERCEPTION + 'essence)' : '')));
            list.append($('<li>').html(' - Will: ' + sheet.attributes.WILL + ((sheet.essence >= sheet.attributeLevelupCosts.WILL) ? ' <button onclick="levelUpAttr(\'WILL\')">+</button> (' + sheet.attributeLevelupCosts.WILL + 'essence)' : '')));
            list.append($('<li>').html(' - Luck: ' + sheet.attributes.LUCK + ((sheet.essence >= sheet.attributeLevelupCosts.LUCK) ? ' <button onclick="levelUpAttr(\'LUCK\')">+</button> (' + sheet.attributeLevelupCosts.LUCK + 'essence)' : '')));
        } else if (this._sheetdisplaymode === 'race') {
            list.append($('<li>').text('Race: ' + sheet.race.name));
            list.append($('<li>').text(sheet.race.description));
        } else if (this._sheetdisplaymode === 'skills' || this._sheetdisplaymode === 'skill') {
            Object.keys(sheet.skills).forEach(function (skill) {
                list.append($('<li>').text(skill + ': ' + sheet.skills[skill]));
            });
        } else if (this._sheetdisplaymode === 'equipment' || this._sheetdisplaymode === 'equip') {
            const slot_names = {
                'WEAPON': 'Weapon',
                'SHIELD': 'Shield',
                'HELMET': 'Head',
                'CHEST_ARMOR': 'Chest',
                'LEG_ARMOR': 'Legs',
                'BOOTS': 'Feet',
                'GLOVES': 'Hands',
                'BELT': 'Belt',
                'NECKLACE': 'Neck',
                'RING': 'Ring',
                'RING_ALT': 'Ring',
            };
            for (const slot in sheet.equipment.equipped) {
                if (sheet.equipment.equipped[slot]) {
                    list.append($('<li>').html('' + (slot_names[slot] || 'UNKNOWN SLOT') + ': ' + getItemHTML(sheet.equipment.equipped[slot]) + '  <button style="padding: 2px;" onclick="unequipItem(\'' + slot + '\')">Unequip</button>'));
                }
            }
        } else if (this._sheetdisplaymode === 'inventory' || this._sheetdisplaymode === 'inv') {
            for (const stack of sheet.equipment.inventory) {
                let dropButtons = (stack.item.weapon_data || stack.item.armor_data)
                    ? '  <button style="padding: 2px;" onclick="equipItem(\'' + stack.item.id + '\')">Equip</button>'
                    : '';
                if (stack.count && stack.count > 1) {
                    dropButtons += '  <button style="padding: 2px;" onclick="dropItem(\'' + stack.item.id + '\', 1)">Drop 1</button> <button style="padding: 2px;" onclick="dropItem(\'' + stack.item.id + '\', null)">Drop All</button>';
                } else {
                    dropButtons += '  <button style="padding: 2px;" onclick="dropItem(\'' + stack.item.id + '\', null)">Drop</button>';
                }
                list.append($('<li>').html(' - ' + getItemHTML(stack.item) + (stack.count ? (' x ' + stack.count) : '') + dropButtons));
            }
        } else {
            list.append($('<li>').text('Mode \"' + this._sheetdisplaymode + '\" does not exist'));
            list.append($('<li>').text('available modes:'));
            list.append($('<li>').text(' - attributes (shorthand: attr)'));
        }

        var list = $("#status");
        list.empty();
        let hover = 'Controls\n - Turn with the arrow keys\n - Use WASD to move\nstrafing takes more AP than moving forward\n - Attack with spacebar';
        hover += '\nbut only in the direction you\'re facing\n - press Z to wait, X to stop waiting\n - press . or > to use stairs';
        list.append($('<li>').html('<span title="' + hover + '"><b>[Controls]</b></span> <- mouse over'));
        list.append($('<li>').text('Player: ' + this.player.name));
        list.append($('<li>').text('Race: ' + sheet.race.name));
        list.append($('<li>').text('Essence: ' + sheet.essence));
        list.append($('<li>').text('Exp: ' + Math.floor(sheet.exp) + '/' + sheet.exp_cap));
        switch (this.player.action.type) {
            case 'NONE':
            case 'WAIT':
            case 'UNWAIT':
                list.append($('<li>').text('Action: ' + this.player.action.type));
                break;
            case 'MOVE':
                list.append($('<li>').text('Action: ' + this.player.action.type + " " + this.player.action.direction));
                break;
            case 'TURN':
                list.append($('<li>').text('Action: ' + this.player.action.type + " " + this.player.action.direction));
                break;
            case 'USE_PORTAL':
                list.append($('<li>').text('Action: ' + this.player.action.type));
                break;
            case 'ATTACK':
                list.append($('<li>').text('Action: ' + this.player.action.type));
                break;
            default:
                list.append($('<li>').text('Action: UNKNOWN ACTION TYPE!'));
                break;
        }
        list.append($('<li>').text(this.boardInfo.your_turn ? 'It\'s your turn!' : 'Other characters are taking their turn...'));
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

        var list = $("#info");
        list.empty();
        if (this.itemsOnGround.length > 0) {
            list.append($('<li>').text('There are items on the ground:'));
            for (const stack of this.itemsOnGround) {
                let takeButtons = '';
                if (stack.count && stack.count > 1) {
                    takeButtons = '  <button style="padding: 2px;" onclick="pickupItem(\'' + stack.item.id + '\', 1)">Take 1</button> <button style="padding: 2px;" onclick="pickupItem(\'' + stack.item.id + '\', null)">Take All</button>';
                } else {
                    takeButtons = '  <button style="padding: 2px;" onclick="pickupItem(\'' + stack.item.id + '\', null)">Take</button>';
                }
                list.append($('<li>').html(' - ' + getItemHTML(stack.item) + (stack.count ? (' x ' + stack.count) : '') + takeButtons));
            }
        }
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
                    if (this._palette[tile]) {
                        if (this._palette[tile].sheet) {
                            let adj = [
                                [false, false, false],
                                [false, true, false],
                                [false, false, false],
                            ];
                            let adjSum = this.tileAdjacencies[x][y];
                            for (let i = -1; i <= 1; i++) {
                                for (let j = -1; j <= 1; j++) {
                                    if (adjSum % 2 === 1) {
                                        adj[i + 1][j + 1] = true;
                                        adjSum--;
                                    }
                                    adjSum /= 2;
                                }
                            }
                            this._drawSubtiles(tile, adj, ((x - 1) * scale) + offsetX, ((y - 1) * scale) + offsetY, scale, scale);
                        } else {
                            this._drawTile(tile, ((x - 1) * scale) + offsetX, ((y - 1) * scale) + offsetY, scale, scale);
                        }
                    }
                }
            }
            for (let i = 0; i < this.items.length; i++) {
                let sprite = this.items[i].item.schema;
                let x = this.items[i].location.x - this.boardInfo.x;
                let y = this.items[i].location.y - this.boardInfo.y;
                this._drawItem(sprite, ((x - 1) * scale) + offsetX, ((y - 1) * scale) + offsetY, scale, scale);
            }
            for (let id in this.game_data.mobs) {
                let sprite = this.game_data.mobs[id].type;
                let x = this.game_data.mobs[id].location.x - this.boardInfo.x;
                let y = this.game_data.mobs[id].location.y - this.boardInfo.y;
                if (sprite === 'text') {
                    //this._drawSquare(((x - 1) * scale) + offsetX, ((y - 1) * scale) + offsetY, scale, scale);
                    this._ctx.fillText(this.game_data.mobs[id].name, ((x - 0.5) * scale) + offsetX, ((y - 0.5) * scale) + offsetY);
                } else {
                    this._drawSprite(sprite, ((x - 1) * scale) + offsetX, ((y - 1) * scale) + offsetY, scale, scale, this.game_data.mobs[id].direction);
                    //V displays action points on mobs
                    //this._ctx.fillText(this.game_data.mobs[id].sheet.status.action_points + '/' + this.game_data.mobs[id].sheet.status.max_action_points + ' (+' + this.game_data.mobs[id].sheet.status.action_point_recovery + ')', ((x - 0.5) * scale) + offsetX, ((y - 0.5) * scale) + offsetY);
                }
            }
        }
    }

    _drawSubtiles(id, adj, x, y, w_2, h_2) {
        let w = w_2 / 2;
        let h = h_2 / 2;
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                let xi = i * 2;
                let yi = j * 2;
                let tx = 0;
                let ty = 0
                if (adj[xi][yi] && adj[xi][1] && adj[1][yi]) {
                    tx = 5; ty = 1;//surrounded
                } else if (!adj[xi][1] && !adj[1][yi]) {
                    tx = 2 + i; ty = j;//convex corner
                } else if (adj[xi][1] && adj[1][yi]) {
                    tx = i; ty = j;//concave corner
                } else if (!adj[xi][1]) {
                    tx = 5 + i;//vertical wall
                } else {
                    tx = 4; ty = j//horizontal wall
                }
                this._ctx.drawImage(this._palette[id].subtiles[tx][ty], Math.floor(x + (w * i)), Math.floor(y + (w * j)), Math.ceil(w), Math.ceil(h));
            }
        }
    }

    _drawTile(id, x, y, w, h) {
        this._ctx.drawImage(this._palette[id].image, Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
    }

    _drawSprite(id, x, y, w, h, dir) {
        this._ctx.save();
        this._ctx.translate(x + w / 2, y + h / 2);
        this._ctx.rotate(Math.PI * (dir / -2));
        this._ctx.drawImage(this._getSprite(id), -w / 2, -h / 2, w, h);
        this._ctx.restore();
    }

    _drawItem(id, x, y, w, h) {
        this._ctx.drawImage(this._getSprite('item/' + id), x, y, w, h);
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
