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
        this._drawQueued = false;
        this._loadImages();
    }

    _loadImages() {
        this._tilesheet = new Image();
        let g = this;
        this._tilesheet.onload = function () {
            let tileSize = 32;//width and height in pixels within sheet
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
        let tilepattern = [
            [3, 3, 3, 3, 3, 3],
            [3, 3, 8, 7, 10, 3],
            [3, 8, 15, 2, 13, 10],
            [3, 4, 2, 2, 2, 5],
            [3, 9, 14, 2, 12, 11],
            [3, 3, 9, 6, 11, 3],
        ];
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
                    let id = 0;
                    switch (tile) {
                        case 0: id = 0; break;
                        case 1: id = 1; break;
                        case 2: id = 2; break;
                        case 3:
                            let s = [
                                [false, false, false],
                                [false, true, false],
                                [false, false, false],
                            ];
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
                            break;
                        default: id = 99; break;
                    }
                    this._drawTile(id, (x * scale) + offsetX, (y * scale) + offsetY, scale, scale);
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

