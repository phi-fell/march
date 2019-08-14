class Game {
    constructor(canvas) {
        this._width = canvas.clientWidth;
        this._height = canvas.clientHeight;
        canvas.width = this._width;
        canvas.height = this._height;
        this._ctx = canvas.getContext('2d');
        this._ctx.font = "bold 12px Arial";
        this.board = undefined;
        this.player = undefined;
    }

    draw() {
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
                    if (this.board[x][y] != null) {
                        this._drawSquare((x * scale) + offsetX, (y * scale) + offsetY, scale, scale);
                        this._ctx.fillText(this.board[x][y].name, ((x + 0.5) * scale) + offsetX, ((y + 0.5) * scale) + offsetY);
                    }
                }
            }
        }
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

