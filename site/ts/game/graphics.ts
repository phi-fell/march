import { Animation } from './animation.js';
import { GraphicsContext } from './graphicscontext.js';
import { DIRECTION, Settings } from './servertypes.js';
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

type AsciiSubPalette = { char: string, color: string };
type AsciiPalette = AsciiSubPalette[]

const TILE_SIZE = 32;

const CANVAS_OVERFLOW = 1;

export class Graphics {
    private width: number = 0;
    private height: number = 0;
    private tileContext: GraphicsContext;
    private entityContext: GraphicsContext;
    private unseenContext: GraphicsContext;
    private fogContext: GraphicsContext;
    private uiContext: GraphicsContext;
    private animations: Record<string, Animation> = {};
    private ascii_palette: AsciiPalette = [];
    private palette: Palette = [];
    private draw_scale = 1;
    private playing_animations: { anim: Animation, loc: Location, dir: DIRECTION, start_time: number }[] = [];
    constructor(
        private tileCanvas: HTMLCanvasElement,
        private entityCanvas: HTMLCanvasElement,
        private unseenCanvas: HTMLCanvasElement,
        private fogCanvas: HTMLCanvasElement,
        private uiCanvas: HTMLCanvasElement,
        private app: {
            board: Board,
            entities: Entity[],
            player_entity: Entity,
            settings: Settings,
            canvas_labels: { 'text': string, 'x': number, 'y': number }[],
        },
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
        this.unseenContext = new GraphicsContext(unseenCanvas, this.width, this.height);
        this.fogContext = new GraphicsContext(fogCanvas, this.width, this.height);
        this.uiContext = new GraphicsContext(uiCanvas, this.width, this.height);
        const g = this;
        $(window).on('resize', () => {
            g.resize();
        });
        // load animations:
        for (const sprite of ['player/A', 'slime']) {
            for (const anim of ['idle', 'attack', 'damaged', 'death', 'corpse']) {
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
        $.getJSON('tex/tiles/ascii.json', (json: unknown) => {
            if (typeof json === 'object' && json !== null) {
                this.ascii_palette = palette.map((tile) => {
                    if (tile in json) {
                        const tile_ascii = (json as Record<string, unknown>)[tile];
                        if (typeof tile_ascii === 'object' && tile_ascii !== null && 'char' in tile_ascii && 'color' in tile_ascii) {
                            return tile_ascii as AsciiSubPalette;
                        }
                    }
                    console.log('Ascii data for tile: ' + tile + ' could not be loaded!')
                    return {
                        'char': '?',
                        'color': '#F0F',
                    }
                })
            } else {
                console.log('Ascii Palette could not be loaded!')
            }
            console.log(this.ascii_palette);
        });
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
        if (this.app.settings.graphics.ascii) {
            return;
        }
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
        this.unseenContext.resize(this.width, this.height);
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
        if (this.app.settings.graphics.ascii) {
            this.unseenContext.clear();
            this.tileContext.setTextProps();
            this.entityContext.setTextProps();
            this.drawAsciiTiles();
            this.drawAsciiEntities();
            this.drawFog();
        } else {
            this.startUnseenDraw();
            this.drawTiles();
            this.endUnseenDraw();
            this.drawEntities();
            this.drawFog();
        }
    }
    private drawFog() {
        this.fogContext.clear();
        this.fogContext.push();
        if (this.app.settings.graphics.ascii) {
            this.fogContext.filter(`opacity(75%)`);
        } else {
            this.fogContext.filter(`opacity(75%) blur(${this.draw_scale / 2}px)`);
        }
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
    private drawAsciiEntities() {
        this.entityContext.clear();
        this.entityContext.push();
        this.entityContext.translate(this.width / 2, this.height / 2);
        this.entityContext.scale(this.draw_scale, this.draw_scale);
        this.entityContext.translate(-this.app.player_entity.location.x, -this.app.player_entity.location.y);
        const entval = (ent: Entity) => {
            if (this.app.player_entity.id === ent.id) {
                return 5;
            }
            if (ent.components.sheet !== undefined) {
                return 4;
            }
            if (ent.components.item_data !== undefined) {
                return 3;
            }
            if (ent.components.corpse_data !== undefined) {
                return 2;
            }
            if (ent.components.portal !== undefined) {
                return 1;
            }
            return 0;
        }
        this.app.entities.sort((a, b) => {
            return entval(a) - entval(b);
        });
        for (const entity of this.app.entities) {
            this.entityContext.push();
            this.entityContext.translate(entity.location.x, entity.location.y);
            const sprite = entity.components.sprite;
            const dir = entity.components.direction;
            if (typeof sprite === 'string') {
                this.entityContext.push();
                this.entityContext.color('#000');
                this.entityContext.fillRect();
                this.entityContext.color('#FFF');
                this.entityContext.scale(0.75, 0.75);
                if (this.app.player_entity.id === entity.id) {
                    this.entityContext.drawChar('@');
                } else if (entity.components.sheet !== undefined) {
                    this.entityContext.drawChar(sprite.charAt(4));
                } else if (entity.components.item_data !== undefined) {
                    this.entityContext.drawChar('&');
                } else if (entity.components.corpse_data !== undefined) {
                    this.entityContext.drawChar('_');
                } else if (entity.components.portal !== undefined) {
                    this.entityContext.drawChar('>');
                } else {
                    this.entityContext.color('#F0F');
                    this.entityContext.drawChar('?');
                }
                this.entityContext.pop();
                if (dir !== undefined) {
                    this.entityContext.push();
                    this.entityContext.rotate(DIRECTION[dir] * Math.PI / -2)
                    this.getAnimation('arrow').draw(this.entityContext, 0);
                    this.entityContext.pop();
                }
            } else {
                this.entityContext.color('#F0F');
                this.entityContext.fillRect();
            }
            this.entityContext.pop();
        }
        this.entityContext.pop();
    }
    private drawEntities() {
        this.entityContext.clear();
        this.entityContext.push();
        this.entityContext.translate(this.width / 2, this.height / 2);
        this.entityContext.scale(this.draw_scale, this.draw_scale);
        this.entityContext.translate(-this.app.player_entity.location.x, -this.app.player_entity.location.y);
        const entval = (ent: Entity) => {
            if (this.app.player_entity.id === ent.id) {
                return 5;
            }
            if (ent.components.sheet !== undefined) {
                return 4;
            }
            if (ent.components.item_data !== undefined) {
                return 3;
            }
            if (ent.components.corpse_data !== undefined) {
                return 2;
            }
            if (ent.components.portal !== undefined) {
                return 1;
            }
            return 0;
        }
        this.app.entities.sort((a, b) => {
            return entval(a) - entval(b);
        });
        for (const entity of this.app.entities) {
            this.entityContext.push();
            this.entityContext.translate(entity.location.x, entity.location.y);
            const sprite = entity.components.sprite;
            const anim = entity.animation_playing;
            const anim_start = entity.animation_start_time;
            const gear: { [id: string]: Animation } = {};
            const sheet = entity.components.sheet;
            const dir = entity.components.direction;
            if (sprite?.startsWith('mob/player')) {
                this.getAnimation('shadow').draw(this.entityContext, 0);
            }
            if (dir !== undefined) {
                this.entityContext.push();
                this.entityContext.rotate(DIRECTION[dir] * Math.PI / -2)
                this.getAnimation('arrow').draw(this.entityContext, 0);
                this.entityContext.pop();
            }
            if (sheet !== undefined) {
                const equipment = sheet.equipment;
                const weapon = equipment.weapon;
                if (weapon !== undefined) {
                    gear.weapon = this.getAnimation(weapon.sprite);
                }
                for (const entry of Object.entries(equipment.armor)) {
                    const [slot, item] = entry;
                    if (item !== undefined) {
                        gear[slot.toLowerCase()] = this.getAnimation(item.sprite);
                    }
                }
            }
            if (anim !== undefined && anim_start !== undefined) {
                this.getAnimation(anim).draw(this.entityContext, Date.now() - anim_start, gear);
            } else if (typeof sprite === 'string') {
                if (entity.components.sheet) {
                    this.getAnimation(sprite + '/idle').draw(this.entityContext, Date.now(), gear);
                } else if (entity.components.corpse_data !== undefined) {
                    this.getAnimation(sprite + '/corpse').draw(this.entityContext, Date.now());
                } else {
                    this.getAnimation(sprite).draw(this.entityContext, Date.now());
                }
            } else {
                this.entityContext.color('#F0F');
                this.entityContext.fillRect();
            }
            this.entityContext.pop();
        }
        this.playing_animations = this.playing_animations.filter((a) => {
            return Date.now() < a.start_time + a.anim.duration;
        })
        for (const animation of this.playing_animations) {
            this.entityContext.push();
            this.entityContext.translate(animation.loc.x, animation.loc.y);
            this.entityContext.rotate(animation.dir * Math.PI / -2)
            animation.anim.draw(this.entityContext, Date.now() - animation.start_time);
            this.entityContext.pop();
        }
        this.entityContext.pop();
    }
    private startUnseenDraw() {
        this.unseenContext.clear();
        this.unseenContext.push();
        this.unseenContext.filter(`blur(${this.draw_scale / 2}px)`);
        this.unseenContext.translate(this.width / 2, this.height / 2);
        this.unseenContext.scale(this.draw_scale, this.draw_scale)
        this.unseenContext.translate(-.5, -.5);
        this.unseenContext.translate(this.app.board.x - this.app.player_entity.location.x, this.app.board.y - this.app.player_entity.location.y);
        this.unseenContext.color('#000');
        this.unseenContext.startDraw();
    }
    private endUnseenDraw() {
        this.unseenContext.finalizeDraw();
        this.unseenContext.pop();
    }
    private drawAsciiTiles() {
        this.tileContext.clear();
        this.tileContext.push();
        this.tileContext.translate(this.width / 2, this.height / 2);
        this.tileContext.scale(this.draw_scale, this.draw_scale)
        this.tileContext.translate(this.app.board.x - this.app.player_entity.location.x, this.app.board.y - this.app.player_entity.location.y);
        for (let x = 0; x < this.app.board.width; x++) {
            for (let y = 0; y < this.app.board.height; y++) {
                const tile = this.app.board.tiles[x][y];
                this.tileContext.push();
                this.tileContext.translate(x, y);
                this.tileContext.color('#000');
                this.tileContext.fillRect();
                if (tile !== -1) {
                    if (this.ascii_palette[tile] === undefined) {
                        this.tileContext.color('#F0F');
                        this.tileContext.drawChar('?');
                    } else {
                        const ascii = this.ascii_palette[tile];
                        this.tileContext.color(ascii.color);
                        this.tileContext.drawChar(ascii.char);
                    }
                }
                this.tileContext.pop();
            }
        }
        this.tileContext.pop();
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
                    this.unseenContext.addRect(x - 0.5, y - 0.5, 2, 2);
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
