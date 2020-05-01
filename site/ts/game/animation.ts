import { GraphicsContext } from './graphicscontext.js';

export class Animation {
    private loaded: boolean = false;
    private image: HTMLImageElement = new Image();
    private frame_count: number = 0;
    private frame_width: number = 1;
    private frame_height: number = 1;
    private delay: number = 0;
    private offset: { x: number, y: number } = { 'x': 0, 'y': 0 };
    private scale: { x: number, y: number } = { 'x': 0, 'y': 0 };
    private frames: HTMLCanvasElement[] = [];
    constructor(id: string) {
        $.getJSON('tex/animation/' + id + '.json', (json) => {
            this.image.onload = () => {
                this.frame_count = json.frames;
                this.frame_width = json.frame_width;
                this.frame_height = json.frame_height;
                this.delay = json.delay;
                this.offset = json.offset;
                this.scale = json.scale;
                for (let i = 0; i < json.frames; i++) {
                    this.frames[i] = document.createElement('canvas');
                    const context = this.frames[i].getContext('2d');
                    if (!context) {
                        throw new Error('Could not create animation context!');
                    }
                    this.frames[i].width = json.frame_width;
                    this.frames[i].height = json.frame_height;
                    context.drawImage(
                        this.image,
                        i * json.frame_width, 0, json.frame_width, json.frame_height, // src(x y w h)
                        0, 0, json.frame_width, json.frame_height, // dest(x y w h)
                    );
                }
                this.loaded = true;
            };
            this.image.src = 'tex/animation/' + id + '.png';
        });
    }
    public draw(context: GraphicsContext, time: number) {
        context.push();
        try {
            if (!this.loaded) {
                context.color('#F0F');
                context.fillRect(-1 / 2, -1 / 2, 1, 1);
            } else {
                const frame = Math.floor((time / this.delay) % this.frame_count); // TODO: add Math.max and Math.min to ensure within array bounds?
                context.translate(this.offset.x, this.offset.y);
                context.scale(this.scale.x, this.scale.y);
                context.drawImage(this.frames[frame]);
            }
        } finally {
            context.pop();
        }
    }
}
