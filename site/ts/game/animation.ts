import { int_hash } from '../util.js';
import { GraphicsContext } from './graphicscontext.js';

type Anchor = { x: number, y: number, rot: number }[];

enum ORDER {
    NORMAL,
    REVERSE,
    RANDOM,
}

export class Animation {
    private loaded: boolean = false;
    private animation: boolean = false;
    private image: HTMLImageElement = new Image();
    private frame_count: number = 0;
    private frame_width: number = 1;
    private frame_height: number = 1;
    private order: ORDER = ORDER.NORMAL;
    private delay: number = 1000;
    private offset: { x: number, y: number } = { 'x': 0, 'y': 0 };
    private scale: { x: number, y: number } = { 'x': 1, 'y': 1 };
    private angle: number = 0;
    private frames: HTMLCanvasElement[] = [];
    private origin_anchor = { 'x': 0, 'y': 0, 'angle': 0 };
    private anchors: { [id: string]: Anchor | undefined } = {};
    constructor(id: string) {
        this.image.onload = () => {
            $.getJSON('tex/sprite/' + id + '.json', (json) => {
                this.frame_count = json.frames;
                this.frame_width = json.frame_width;
                this.frame_height = json.frame_height;
                this.delay = json.delay;
                this.offset = json.offset;
                this.scale = json.scale;
                if (json.order !== undefined) {
                    if (json.order === 'reverse') {
                        this.order = ORDER.REVERSE;
                    } else if (json.order === 'random') {
                        this.order = ORDER.RANDOM;
                    }
                }
                if (json.origin_anchor) {
                    if (json.origin_anchor.angle === undefined) {
                        json.origin_anchor.angle = 0;
                    }
                    this.origin_anchor = json.origin_anchor;
                }
                if (json.angle !== undefined) {
                    this.angle = json.angle;
                }
                if (json.anchors) {
                    for (const anchor_id of json.anchors) {
                        const anchor_image = new Image();
                        anchor_image.onload = () => {
                            const anchor: Anchor = [];
                            for (let i = 0; i < json.frames; i++) {
                                const frame = document.createElement('canvas');
                                const context = frame.getContext('2d');
                                if (!context) {
                                    throw new Error('Could not create animation anchor context!');
                                }
                                frame.width = this.frame_width;
                                frame.height = this.frame_height;
                                context.drawImage(
                                    anchor_image,
                                    i * this.frame_width, 0, this.frame_width, this.frame_height, // src(x y w h)
                                    0, 0, this.frame_width, this.frame_height, // dest(x y w h)
                                );
                                anchor.push((() => {
                                    let red_x = 0;
                                    let red_y = 0;
                                    let red_count = 0;
                                    let green_x = 0;
                                    let green_y = 0;
                                    let green_count = 0;
                                    for (let x = 0; x < this.frame_width; x++) {
                                        for (let y = 0; y < this.frame_height; y++) {
                                            const rgba = context.getImageData(x, y, 1, 1).data;
                                            if (rgba[3] > 128) {
                                                if (rgba[0] >= 128) {
                                                    red_x += x;
                                                    red_y += y;
                                                    red_count++;
                                                }
                                                if (rgba[1] >= 128) {
                                                    green_x += x;
                                                    green_y += y;
                                                    green_count++;
                                                }
                                            }
                                        }
                                    }
                                    red_x = red_x / red_count;
                                    red_y = red_y / red_count;
                                    if (green_count === 0) {
                                        return {
                                            'x': (red_x / this.frame_width) - 0.5,
                                            'y': (red_y / this.frame_width) - 0.5,
                                            'rot': 0,
                                        };
                                    }
                                    green_x = green_x / green_count;
                                    green_y = green_y / green_count;
                                    return {
                                        'x': (red_x / this.frame_width) - 0.5,
                                        'y': (red_y / this.frame_width) - 0.5,
                                        'rot': Math.atan2(green_y - red_y, green_x - red_x),
                                    };
                                })());
                            }
                            this.anchors[anchor_id] = anchor;
                        };
                        anchor_image.src = `tex/sprite/${id}_anchors/${anchor_id}.png`;
                    }
                }
                for (let i = 0; i < json.frames; i++) {
                    this.frames[i] = document.createElement('canvas');
                    const context = this.frames[i].getContext('2d');
                    if (!context) {
                        throw new Error('Could not create animation context!');
                    }
                    this.frames[i].width = this.frame_width;
                    this.frames[i].height = this.frame_height;
                    context.drawImage(
                        this.image,
                        i * json.frame_width, 0, json.frame_width, json.frame_height, // src(x y w h)
                        0, 0, json.frame_width, json.frame_height, // dest(x y w h)
                    );
                }
                this.animation = true;
            });
            this.loaded = true;
        };
        this.image.src = 'tex/sprite/' + id + '.png';
    }
    public get duration() {
        return this.frame_count * this.delay;
    }
    public draw(context: GraphicsContext, time: number, anchored?: { [id: string]: Animation }) {
        context.push();
        try {
            if (this.loaded) {
                if (this.animation) {
                    let frame = 0;
                    if (this.order === ORDER.NORMAL) {
                        frame = Math.floor((time / this.delay) % this.frame_count);
                    } else if (this.order === ORDER.REVERSE) {
                        frame = (this.frame_count - 1) - (Math.floor((time / this.delay) % this.frame_count));
                    } else if (this.order === ORDER.RANDOM) {
                        frame = int_hash(Math.floor(time / this.delay)) % this.frame_count;
                    }
                    if (this.angle !== 0) {
                        context.rotate(this.angle);
                    }
                    context.translate(this.offset.x, this.offset.y);
                    context.scale(this.scale.x, this.scale.y);
                    context.drawImage(this.frames[frame]);
                    if (anchored !== undefined) {
                        Object.keys(anchored).forEach((anchor_id) => {
                            const anchor = this.anchors[anchor_id];
                            const animation = anchored[anchor_id];
                            if (anchor !== undefined && animation !== undefined) {
                                context.push();
                                context.translate(anchor[frame].x, anchor[frame].y)
                                context.rotate(anchor[frame].rot);
                                context.translate(-animation.origin_anchor.x, -animation.origin_anchor.y);
                                context.rotate(animation.origin_anchor.angle);
                                animation.draw(context, time);
                                context.pop();
                            }
                        });
                    }
                } else {
                    context.drawImage(this.image);
                }
            } else {
                context.color('#F0F');
                context.fillRect();
            }
        } finally {
            context.pop();
        }
    }
}
