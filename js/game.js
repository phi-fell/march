class Game {
    constructor(canvas, width, height) {
        canvas.width = width;
        canvas.height = height;
        this._width = width;
        this._height = height;
        this._ctx = canvas.getContext('2d');
        this._ctx.font = "bold 12px Arial";
        this.board = undefined;
    }

    draw() {
        this._clear();
        this._drawBoard();
        if (this.board !== undefined) {
            this._ctx.textBaseline = 'middle';
            this._ctx.textAlign = "center";
            for (var x = 0; x < this.board.length; x++) {
                for (var y = 0; y < this.board[0].length; y++) {
                    if (this.board[x][y] != null) {
                        this._drawSquare(x, y);
                        this._ctx.fillText(this.board[x][y].info.name, (x * 64) + 32, (y * 64) + 32);
                    }
                }
            }
        }
    }

    _drawSquare(x, y) {
        this._ctx.beginPath();
        this._ctx.rect(x * 64, y * 64, 64, 64);
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

var game = new Game(document.getElementById('gameCanvas'), 640, 640);

