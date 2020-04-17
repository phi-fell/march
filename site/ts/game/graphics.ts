import { Animation } from './animation';
import { GraphicsContext } from './graphicscontext';

export class Graphics {
    private width: number;
    private height: number;
    private tileContext: GraphicsContext;
    private entityContext: GraphicsContext;
    private uiContext: GraphicsContext;
    private redrawing: boolean = false;
    private animations: Record<string, Animation> = {};
    constructor(
        private tileCanvas: HTMLCanvasElement,
        entityCanvas: HTMLCanvasElement,
        uiCanvas: HTMLCanvasElement,
        uiLabels: { 'text': string, 'x': number, 'y': number }[],
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
        const g = this;
        $(window).on('resize', () => {
            g.resize();
        });
        const draw_loop = () => {
            setTimeout(() => {
                this.draw();
                draw_loop();
            }, 20);
        };
    }
    public getAnimation(id: string) {
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
        this.draw();
    }
    private draw() {
        this.tileContext.push();
        this.tileContext.translate(100, 100);
        this.getAnimation('mob/slime/idle').draw(this.tileContext, Date.now());
        this.tileContext.pop();
    }
}
