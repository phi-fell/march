class Game {
    constructor(canvas) {
        this._width = canvas.clientWidth;
        this._height = canvas.clientHeight;
        canvas.width = this._width;
        canvas.height = this._height;
        this._ctx = canvas.getContext('2d');
        this._ctx.font = "bold 12px Arial";
        this._ctx.imageSmoothingEnabled = false;
        this.board = undefined;
        this.tiles = undefined;
        this.player = undefined;
        this._tilesheet = undefined;
        this._tileset = [];
        this._subtiles = [];
        this._drawQueued = false;
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

    _draw() {
        this._clear();
        this._drawBoard();
        if (this.board !== undefined) {
            this._ctx.textBaseline = 'middle';
            this._ctx.textAlign = "center";
            var scaleX = this._width / this.board.length;
            var scaleY = this._height / this.board[0].length;
            var scale = Math.max(scaleX, scaleY);
            scale = Math.max(scale, 40);//TODO: switch to a % of window dimensions? e.g. (this._width / 20) to show 20 tiles at most, instead of 40px width min.
            scale = Math.min(scale, 100);//TODO: as above ^ but for maximum size?
            var offsetX = Math.max(Math.min((this._width / 2) - ((this.player.location.x + 0.5) * scale), 0), this._width - (this.board.length * scale));
            var offsetY = Math.max(Math.min((this._height / 2) - ((this.player.location.y + 0.5) * scale), 0), this._height - (this.board[0].length * scale));
            for (var x = 0; x < this.board.length; x++) {
                for (var y = 0; y < this.board[0].length; y++) {
                    let tile = this.tiles[x][y];
                    switch (tile) {
                        case 3:
                            let newAlg = true;
                            if (newAlg) {
                                let ids = [
                                    [0, 0, 0],
                                    [0, tile, 0],
                                    [0, 0, 0],
                                ];
                                for (let i = -1; i <= 1; i++) {
                                    for (let j = -1; j <= 1; j++) {
                                        if (i != 0 || j != 0) {
                                            if (x + i <= 0
                                                || y + j <= 0
                                                || x + i >= this.board.length
                                                || y + j >= this.board[0].length) {
                                                ids[i + 1][j + 1] = tile;
                                            } else {
                                                ids[i + 1][j + 1] = this.tiles[x + i][y + j];
                                            }
                                        }
                                    }
                                }
                                this._drawSubtiles(ids, (x * scale) + offsetX, (y * scale) + offsetY, scale, scale);
                            } else {
                                let s = [
                                    [false, false, false],
                                    [false, true, false],
                                    [false, false, false],
                                ];
                                let id = 0;
                                let c = 0;
                                for (let i = -1; i <= 1; i++) {
                                    for (let j = -1; j <= 1; j++) {
                                        if (i != 0 || j != 0) {
                                            if (x + i <= 0
                                                || y + j <= 0
                                                || x + i >= this.board.length
                                                || y + j >= this.board[0].length
                                                || this.tiles[x + i][y + j] != 2) {
                                                s[i + 1][j + 1] = true;
                                                c++;
                                            }
                                        }
                                    }
                                }
                                if (c == 8) {//fully surrounded
                                    id = 3;
                                } else if (s[0][1] && s[1][0] && s[2][1] && s[1][2]) {//must be concave corner
                                    if (!s[2][2]) {//concave top left corner
                                        id = 8;
                                    } else if (!s[0][2]) {//concave top right corner
                                        id = 9;
                                    } else if (!s[2][0]) {//concave bottom left corner
                                        id = 10;
                                    } else if (!s[0][0]) {//concave bottom right corner
                                        id = 11;
                                    }
                                } else if (s[0][1] && s[1][0] && s[2][1]) {//top wall
                                    id = 4;
                                } else if (s[0][1] && s[2][1] && s[1][2]) {///bottom wall
                                    id = 5;
                                } else if (s[0][1] && s[1][0] && s[1][2]) {//left wall
                                    id = 7;
                                } else if (s[1][0] && s[2][1] && s[1][2]) {//right wall
                                    id = 6;
                                } else if (s[2][2]) {//convex top left corner
                                    id = 12;
                                } else if (s[0][2]) {//convex top right corner
                                    id = 13;
                                } else if (s[2][0]) {//convex bottom left corner
                                    id = 14;
                                } else if (s[0][0]) {//convex bottom right corner
                                    id = 15;
                                }
                                this._drawTile(id, (x * scale) + offsetX, (y * scale) + offsetY, scale, scale);
                            }
                            break;
                        case 0:
                        case 1:
                        case 2:
                            this._drawTile(tile, (x * scale) + offsetX, (y * scale) + offsetY, scale, scale);
                            break;
                        default:
                            this._drawTile(99, (x * scale) + offsetX, (y * scale) + offsetY, scale, scale);
                            break;
                    }
                }
            }
            for (var x = 0; x < this.board.length; x++) {
                for (var y = 0; y < this.board[0].length; y++) {
                    if (this.board[x][y] != null) {
                        this._drawSquare((x * scale) + offsetX, (y * scale) + offsetY, scale, scale);
                        this._ctx.fillText(this.board[x][y].name, ((x + 0.5) * scale) + offsetX, ((y + 0.5) * scale) + offsetY);
                    }
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

