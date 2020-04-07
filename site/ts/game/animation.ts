import { GraphicsContext } from './graphicscontext';

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
        const anim = this;
        $.getJSON('tex/animation/' + id + '.json', (json) => {
            anim.image.onload = () => {
                anim.frame_count = json.frames;
                anim.frame_width = json.frame_width;
                anim.frame_height = json.frame_height;
                anim.delay = json.delay;
                anim.offset = json.offset;
                anim.scale = json.scale;
                for (let i = 0; i < json.frames; i++) {
                    anim.frames[i] = document.createElement('canvas');
                    const context = anim.frames[i].getContext('2d');
                    if (!context) {
                        throw Error('Could not create animation context!');
                    }
                    anim.frames[i].width = json.frame_width;
                    anim.frames[i].height = json.frame_height;
                    context.drawImage(
                        anim.image,
                        i * json.frame_width, 0, json.frame_width, json.frame_height, // src(x y w h)
                        0, 0, json.frame_width, json.frame_height, // dest(x y w h)
                    );
                }
                anim.loaded = true;
            };
            anim.image.src = 'tex/animation/' + json.image;
        });
    }
    public draw(context: GraphicsContext, time: number) {
        context.push();
        try {
            if (!this.loaded) {
                context.color('#F0F');
                context.fillRect(-this.frame_width / 2, -this.frame_height / 2, this.frame_width, this.frame_height);
            } else {
                const frame = Math.floor((time / this.delay) % this.frame_count); // TODO: add Math.max and Math.min to ensure within array bounds?
                context.translate(this.offset.x, this.offset.y);
                context.scale(this.scale.x, this.scale.y);
                context.drawImage(this.frames[frame], -this.frame_width / 2, -this.frame_height / 2, this.frame_width, this.frame_height);
            }
        } finally {
            context.pop();
        }
    }
}
