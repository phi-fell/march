import { GraphicsContext } from './graphicscontext.js';

export class Animation {
    private loaded: boolean = false;
    private animation: boolean = false;
    private image: HTMLImageElement = new Image();
    private frame_count: number = 0;
    private frame_width: number = 1;
    private frame_height: number = 1;
    private delay: number = 1000;
    private offset: { x: number, y: number } = { 'x': 0, 'y': 0 };
    private scale: { x: number, y: number } = { 'x': 1, 'y': 1 };
    private frames: HTMLCanvasElement[] = [];
    private weapon_anchor?: { x: number, y: number, rot: number }[];
    constructor(id: string) {
        this.image.onload = () => {
            $.getJSON('tex/sprite/' + id + '.json', (json) => {
                this.frame_count = json.frames;
                this.frame_width = json.frame_width;
                this.frame_height = json.frame_height;
                this.delay = json.delay;
                this.offset = json.offset;
                this.scale = json.scale;
                if (json.weapon_anchor) {
                    const anchor_image = new Image();
                    anchor_image.onload = () => {
                        this.weapon_anchor = [];
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
                            this.weapon_anchor.push((() => {
                                let red = false;
                                let green = false;
                                let redx = 0;
                                let redy = 0;
                                let greenx = 0;
                                let greeny = 0;
                                for (let x = 0; x < this.frame_width; x++) {
                                    for (let y = 0; y < this.frame_height; y++) {
                                        if (!red && context.getImageData(x, y, 1, 1).data[0] > 0.5) {
                                            redx = x;
                                            redy = y;
                                            red = true;
                                        }
                                        if (!green && context.getImageData(x, y, 1, 1).data[1] > 0.5) {
                                            greenx = x;
                                            greeny = y;
                                            green = true;
                                        }
                                    }
                                }
                                return {
                                    'x': redx / this.frame_width,
                                    'y': redy / this.frame_width,
                                    'rot': Math.atan2(greeny - redy, greenx - redx),
                                };
                            })());
                        }
                    };
                    anchor_image.src = 'tex/sprite/' + json.weapon_anchor + '.png';
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
    public draw(context: GraphicsContext, time: number, anchored?: Animation) {
        context.push();
        try {
            if (this.loaded) {
                if (this.animation) {
                    const frame = Math.floor((time / this.delay) % this.frame_count); // TODO: add Math.max and Math.min to ensure within array bounds?
                    context.translate(this.offset.x, this.offset.y);
                    context.scale(this.scale.x, this.scale.y);
                    if (this.weapon_anchor !== undefined && anchored !== undefined) {
                        context.push();
                        context.translate(this.weapon_anchor[frame].x, this.weapon_anchor[frame].y)
                        context.rotate(this.weapon_anchor[frame].rot);
                        context.translate(0, -0.5);
                        anchored.draw(context, time);
                        context.pop();
                    }
                    context.drawImage(this.frames[frame]);
                } else {
                    context.drawImage(this.image);
                }
            } else {
                context.color('#F0F');
                context.fillRect(0, 0, 1, 1);
            }
        } finally {
            context.pop();
        }
    }
}
