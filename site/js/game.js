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
            var scaleX = this._width / (this.board.length - 2);
            var scaleY = this._height / (this.board[0].length - 2);
            var scale = Math.max(scaleX, scaleY);
            var offsetX = 0;
            var offsetY = 0;
            if (this._width < this._height) {
                offsetX = (this._width - this._height) / 2;
            } else if (this._height < this._width) {
                offsetY = (this._height - this._width) / 2;
            }
            for (var x = 1; x < this.board.length - 1; x++) {
                for (var y = 1; y < this.board[0].length - 1; y++) {
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
            for (var x = 1; x < this.board.length - 1; x++) {
                for (var y = 1; y < this.board[0].length - 1; y++) {
                    if (this.board[x][y] != null) {
                        this._drawSquare(((x - 1) * scale) + offsetX, ((y - 1) * scale) + offsetY, scale, scale);
                        this._ctx.fillText(this.board[x][y].name, ((x - 0.5) * scale) + offsetX, ((y - 0.5) * scale) + offsetY);
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