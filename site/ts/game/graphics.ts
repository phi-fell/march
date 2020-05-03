import { Animation } from './animation.js';
import { GraphicsContext } from './graphicscontext.js';
import type { Board } from './servertypes.js';

interface TileSprite {
    sheet: false,
    image: HTMLImageElement,
}

interface SubtilesSprite {
    sheet: true,
    subtiles: HTMLCanvasElement[][],
}

type SubPalette = TileSprite | SubtilesSprite;

type Palette = SubPalette[];

const TILE_SIZE = 32;

export class Graphics {
    private width: number;
    private height: number;
    private tileContext: GraphicsContext;
    private entityContext: GraphicsContext;
    private uiContext: GraphicsContext;
    private animations: Record<string, Animation> = {};
    private board?: Board;
    private palette: Palette = [];
    private draw_cache = {
        'all_stale': true,
        'tiles_stale': true,
        'scale': 1,
    }
    constructor(
        private tileCanvas: HTMLCanvasElement,
        private entityCanvas: HTMLCanvasElement,
        private uiCanvas: HTMLCanvasElement,
        private uiLabels: { 'text': string, 'x': number, 'y': number }[],
    ) {
        const w = tileCanvas.clientWidth;
        const h = tileCanvas.clientHeight;
        console.log('(' + w + ', ' + h + ')');
        if (!w) {
            throw new Error('invalid canvas width!');
        }
        if (!h) {
            throw new Error('invalid canvas height!');
        }
        this.width = w;
        this.height = h;
        this.tileContext = new GraphicsContext(tileCanvas, this.width, this.height);
        this.entityContext = new GraphicsContext(entityCanvas, this.width, this.height);
        this.uiContext = new GraphicsContext(uiCanvas, this.width, this.height);
        this.entityContext.drawBehind();
        const g = this;
        $(window).on('resize', () => {
            g.resize();
        });
    }
    public startDrawLoop() {
        setTimeout(() => {
            this.draw();
            this.startDrawLoop();
        }, 20);
    }
    public setBoard(board: Board) {
        this.board = board;
        this.draw_cache.tiles_stale = true;
    }
    public setPalette(palette: string[]) {
        this.palette = [];
        palette.forEach((name: string, index: number) => {
            const image = new Image();
            image.onload = () => {
                if (image.width === TILE_SIZE && image.height === TILE_SIZE) {
                    this.palette[index] = {
                        'sheet': false,
                        'image': image,
                    };
                } else {
                    const st: HTMLCanvasElement[][] = [];
                    for (let x = 0; x * TILE_SIZE < image.width; x++) {
                        st[x] = [];
                        for (let y = 0; y * TILE_SIZE < image.height; y++) {
                            st[x][y] = document.createElement('canvas');
                            const context = st[x][y].getContext('2d');
                            if (!context) {
                                throw new Error('Could not get context 2d for subtiles!');
                            }
                            st[x][y].width = TILE_SIZE;
                            st[x][y].height = TILE_SIZE;
                            context.drawImage(image, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE, 0, 0, TILE_SIZE, TILE_SIZE);
                        }
                    }
                    this.palette[index] = {
                        'sheet': true,
                        'subtiles': st,
                    };
                }
                this.draw_cache.tiles_stale = true;
            }
            image.onerror = () => {
                console.log('could not load')
            }
            image.src = `tex/tiles/${name}.png`;
        });
    }
    private getAnimation(id: string) {
        if (!this.animations[id]) {
            this.animations[id] = new Animation(id);
        }
        return this.animations[id];
    }
    private resize() {
        this.width = this.tileCanvas.clientWidth;
        this.height = this.tileCanvas.clientHeight;
        this.tileContext.resize(this.width, this.height);
        this.entityContext.resize(this.width, this.height);
        this.uiContext.resize(this.width, this.height);
        this.draw_cache.all_stale = true;
    }
    private draw() {
        if (!this.board) {
            return console.log('Can\'t draw! No board!');
        }
        if (this.draw_cache.all_stale) {
            const scaleX = this.width / this.board.width;
            const scaleY = this.height / this.board.height;
            this.draw_cache.scale = Math.max(scaleX, scaleY);
            // set individual staleness flags
            this.draw_cache.tiles_stale = true;
        }
        this.draw_cache.all_stale = false;
        if (this.draw_cache.tiles_stale) {
            this.drawTiles();
            this.draw_cache.tiles_stale = false;
        }
        this.entityContext.clear();
        this.entityContext.push();
        this.entityContext.translate(this.width / 2, this.height / 2);
        this.entityContext.scale(this.draw_cache.scale, this.draw_cache.scale);
        this.entityContext.translate(this.board.width / -2, this.board.height / -2);
        this.entityContext.translate(-this.board.x, -this.board.y);
        for (const entity of this.board.entities) {
            this.entityContext.push();
            this.entityContext.translate(entity.location.x, entity.location.y);
            const sprite = entity.components.sprite;
            if (typeof sprite === 'string') {
                this.getAnimation(sprite).draw(this.entityContext, Date.now());
            } else {
                this.entityContext.color('#F0F');
                this.entityContext.fillRect(-.5, -.5);
            }
            this.entityContext.pop();
        }
        this.entityContext.pop();
    }
    private drawTiles() {
        if (!this.board) {
            return console.log('Can\'t draw! No board!');
        }
        this.tileContext.clear();
        this.tileContext.push();
        this.tileContext.translate(this.width / 2, this.height / 2);
        this.tileContext.scale(this.draw_cache.scale, this.draw_cache.scale);
        this.tileContext.translate(this.board.width / -2, this.board.height / -2);
        for (let x = 0; x < this.board.width; x++) {
            for (let y = 0; y < this.board.height; y++) {
                const tile = this.board.tiles[x][y];
                if (tile === -1) {
                    this.tileContext.push();
                    this.tileContext.color('#000');
                    this.tileContext.fillRect(x, y, 1, 1);
                    this.tileContext.pop();
                } else if (!this.palette[tile]) {
                    this.tileContext.push();
                    this.tileContext.color('#F0F');
                    this.tileContext.fillRect(x, y, 1, 1);
                    this.tileContext.pop();
                } else {
                    const sprite = this.palette[tile];
                    if (sprite.sheet) {
                        const adj = [
                            [false, false, false],
                            [false, true, false],
                            [false, false, false],
                        ];
                        let adjSum = this.board.tileAdjacencies[x][y];
                        for (let i = -1; i <= 1; i++) {
                            for (let j = -1; j <= 1; j++) {
                                if (adjSum % 2 === 1) {
                                    adj[i + 1][j + 1] = true;
                                    adjSum--;
                                }
                                adjSum /= 2;
                            }
                        }
                        for (let i = 0; i < 2; i++) {
                            for (let j = 0; j < 2; j++) {
                                const xi = i * 2;
                                const yi = j * 2;
                                let tx = 0;
                                let ty = 0
                                if (adj[xi][yi] && adj[xi][1] && adj[1][yi]) {
                                    tx = 5; ty = 1;// surrounded
                                } else if (!adj[xi][1] && !adj[1][yi]) {
                                    tx = 2 + i; ty = j;// convex corner
                                } else if (adj[xi][1] && adj[1][yi]) {
                                    tx = i; ty = j;// concave corner
                                } else if (!adj[xi][1]) {
                                    tx = 5 + i;// vertical wall
                                } else {
                                    tx = 4; ty = j// horizontal wall
                                }
                                this.tileContext.drawImage(sprite.subtiles[tx][ty], x + (i / 2), y + (j / 2), 0.5, 0.5);
                            }
                        }
                    } else {
                        this.tileContext.drawImage(sprite.image, x, y, 1, 1);
                    }
                }
            }
        }
        this.tileContext.pop();
    }
}
