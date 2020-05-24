import { Animation } from './animation.js';
import { GraphicsContext } from './graphicscontext.js';
import { DIRECTION } from './servertypes.js';
import type { Board, Entity, Location } from './servertypes.js';

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

const CANVAS_OVERFLOW = 1;

export class Graphics {
    private width: number = 0;
    private height: number = 0;
    private tileContext: GraphicsContext;
    private entityContext: GraphicsContext;
    private fogContext: GraphicsContext;
    private uiContext: GraphicsContext;
    private animations: Record<string, Animation> = {};
    private palette: Palette = [];
    private draw_scale = 1;
    private playing_animations: { anim: Animation, loc: Location, dir: DIRECTION, start_time: number }[] = [];
    constructor(
        private tileCanvas: HTMLCanvasElement,
        private entityCanvas: HTMLCanvasElement,
        private fogCanvas: HTMLCanvasElement,
        private uiCanvas: HTMLCanvasElement,
        private app: { board: Board, entities: Entity[], player_entity: Entity, canvas_labels: { 'text': string, 'x': number, 'y': number }[] },
    ) {
        this.width = this.tileCanvas.clientWidth;
        this.height = this.tileCanvas.clientHeight;
        const scaleX = this.width / (this.app.board.width - (CANVAS_OVERFLOW * 2));
        const scaleY = this.height / (this.app.board.height - (CANVAS_OVERFLOW * 2));
        this.draw_scale = Math.max(scaleX, scaleY);
        console.log('(' + this.width + ', ' + this.height + ')');
        if (!this.width) {
            throw new Error('invalid canvas width!');
        }
        if (!this.height) {
            throw new Error('invalid canvas height!');
        }
        this.tileContext = new GraphicsContext(tileCanvas, this.width, this.height);
        this.entityContext = new GraphicsContext(entityCanvas, this.width, this.height);
        this.fogContext = new GraphicsContext(fogCanvas, this.width, this.height);
        this.uiContext = new GraphicsContext(uiCanvas, this.width, this.height);
        this.entityContext.drawBehind();
        const g = this;
        $(window).on('resize', () => {
            g.resize();
        });
        // load animations:
        for (const sprite of ['player', 'slime']) {
            for (const anim of ['idle', 'attack']) {
                this.getAnimation('mob/' + sprite + '/' + anim);
            }
        }
        this.getAnimation('attack/swing');
    }
    public startDrawLoop() {
        setTimeout(() => {
            this.draw();
            this.startDrawLoop();
        }, 20);
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
            }
            image.onerror = () => {
                console.log('could not load')
            }
            image.src = `tex/tiles/${name}.png`;
        });
    }
    public getAnimation(id: string) {
        if (!this.animations[id]) {
            this.animations[id] = new Animation(id);
        }
        return this.animations[id];
    }
    public playAnimation(id: string, loc: Location, dir: DIRECTION = DIRECTION.NORTH) {
        this.playing_animations.push({
            'anim': this.getAnimation(id),
            loc,
            dir,
            'start_time': Date.now(),
        });
    }
    private resize() {
        this.width = this.tileCanvas.clientWidth;
        this.height = this.tileCanvas.clientHeight;
        this.tileContext.resize(this.width, this.height);
        this.entityContext.resize(this.width, this.height);
        this.fogContext.resize(this.width, this.height);
        this.uiContext.resize(this.width, this.height);
        const scaleX = this.width / (this.app.board.width - (CANVAS_OVERFLOW * 2));
        const scaleY = this.height / (this.app.board.height - (CANVAS_OVERFLOW * 2));
        this.draw_scale = Math.max(scaleX, scaleY);
    }
    private draw() {
        if (this.app.player_entity === undefined) {
            return;
        }
        this.drawTiles();
        this.drawEntities();
        this.drawFog();
    }
    private drawFog() {
        this.fogContext.clear();
        this.fogContext.push();
        this.fogContext.filter(`opacity(75%) blur(${this.draw_scale / 2}px)`); // TODO: change to 75% opacity once cells remember which tiles have yet to be seen
        this.fogContext.translate(this.width / 2, this.height / 2);
        this.fogContext.scale(this.draw_scale, this.draw_scale)
        this.fogContext.translate(-.5, -.5);
        this.fogContext.translate(- this.app.player_entity.location.x, - this.app.player_entity.location.y);
        const visible = this.app.board.fog_of_war.visible
        this.fogContext.color('#000');
        this.fogContext.startDraw();
        for (let x = this.app.board.x - 1; x < this.app.board.x + this.app.board.width + 1; x++) {
            for (let y = this.app.board.y - 1; y < this.app.board.y + this.app.board.height + 1; y++) {
                if (x < 0 || y < 0 || x >= this.app.board.fog_of_war.width || y >= this.app.board.fog_of_war.height || !visible[x][y]) {
                    this.fogContext.addRect(x, y, 1, 1);
                }
            }
        }
        this.fogContext.finalizeDraw();
        this.fogContext.pop();
    }
    private drawEntities() {
        this.entityContext.clear();
        this.entityContext.push();
        this.entityContext.translate(this.width / 2, this.height / 2);
        this.entityContext.scale(this.draw_scale, this.draw_scale);
        this.entityContext.translate(-.5, -.5);
        this.entityContext.translate(-this.app.player_entity.location.x, -this.app.player_entity.location.y);
        this.playing_animations = this.playing_animations.filter((a) => {
            return Date.now() < a.start_time + a.anim.duration;
        })
        for (const animation of this.playing_animations) {
            this.entityContext.push();
            this.entityContext.translate(animation.loc.x, animation.loc.y);
            this.entityContext.translate(0.5, 0.5);
            this.entityContext.rotate(animation.dir * Math.PI / -2)
            this.entityContext.translate(-0.5, -0.5);
            animation.anim.draw(this.entityContext, Date.now() - animation.start_time);
            this.entityContext.pop();
        }
        for (const entity of this.app.entities) {
            this.entityContext.push();
            this.entityContext.translate(entity.location.x, entity.location.y);
            const sprite = entity.components.sprite;
            const anim = entity.animation_playing;
            const anim_start = entity.animation_start_time;
            if (anim !== undefined && anim_start !== undefined) {
                this.getAnimation(anim).draw(this.entityContext, Date.now() - anim_start, {
                    'weapon': this.getAnimation('test'),
                    'helmet': this.getAnimation('item/armor/helmet'),
                });
            } else if (typeof sprite === 'string') {
                if (entity.components.sheet) {
                    this.getAnimation(sprite + '/idle').draw(this.entityContext, Date.now(), {
                        'weapon': this.getAnimation('test'),
                        'helmet': this.getAnimation('item/armor/helmet'),
                    });
                } else {
                    this.getAnimation(sprite).draw(this.entityContext, Date.now());
                }
            } else {
                this.entityContext.color('#F0F');
                this.entityContext.fillRect();
            }
            const dir = entity.components.direction;
            if (dir !== undefined) {
                this.entityContext.translate(0.5, 0.5);
                this.entityContext.rotate(DIRECTION[dir] * Math.PI / -2)
                this.entityContext.translate(-0.5, -0.5);
                this.getAnimation('arrow').draw(this.entityContext, 0);
            }
            this.entityContext.pop();
        }
        this.entityContext.pop();
    }
    private drawTiles() {
        this.tileContext.clear();
        this.tileContext.push();
        this.tileContext.translate(this.width / 2, this.height / 2);
        this.tileContext.scale(this.draw_scale, this.draw_scale)
        this.tileContext.translate(-.5, -.5);
        this.tileContext.translate(this.app.board.x - this.app.player_entity.location.x, this.app.board.y - this.app.player_entity.location.y);
        for (let x = 0; x < this.app.board.width; x++) {
            for (let y = 0; y < this.app.board.height; y++) {
                const tile = this.app.board.tiles[x][y];
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
                        let adjSum = this.app.board.tileAdjacencies[x][y];
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
