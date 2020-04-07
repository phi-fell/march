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
        uiLabels: Array<{ 'text': string, 'x': number, 'y': number }>,
    ) {
        const w = tileCanvas.clientWidth;
        const h = tileCanvas.clientHeight;
        console.log('(' + w + ', ' + h + ')');
        if (!w) {
            throw Error('invalid canvas width!');
        }
        if (!h) {
            throw Error('invalid canvas height!');
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
        this.draw();
    }
    public getAnimation(id: string) {
        if (!this.animations[id]) {
            this.animations[id] = new Animation(id);
        }
        return this.animations[id];
    }
    public queueRedraw() {
        if (this.redrawing) {
            return;
        }
        this.redrawing = true;
        setTimeout(
            () => {
                this.draw();
                this.redrawing = false;
            },
            10,
        );
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
        this.getAnimation('weapon/sword').draw(this.tileContext, Date.now());
        this.tileContext.pop();
    }
}
