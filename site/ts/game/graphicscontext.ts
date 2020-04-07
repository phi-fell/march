export class GraphicsContext {
    private context: CanvasRenderingContext2D;
    constructor(private canvas: HTMLCanvasElement, private width: number, private height: number) {
        canvas.width = this.width;
        canvas.height = this.height;
        const context = canvas.getContext('2d');
        if (!context) {
            throw Error('could not get canvas context!');
        }
        this.context = context;
        this.context.imageSmoothingEnabled = false;
    }
    public resize(w: number, h: number) {
        this.canvas.width = w;
        this.canvas.height = h;
    }
    public clear() {
        this.context.clearRect(0, 0, this.width, this.height);
    }
    public push() {
        this.context.save();
    }
    public pop() {
        this.context.restore();
    }
    public translate(x: number, y: number) {
        this.context.translate(x, y);
    }
    public scale(x: number, y: number) {
        this.context.scale(x, y);
    }
    public drawImage(image: HTMLCanvasElement | HTMLImageElement, dx: number, dy: number, dw: number, dh: number) {
        this.context.drawImage(image, dx, dy, dw, dh);
    }
    public color(stroke: string, fill: string = stroke) {
        this.context.strokeStyle = stroke;
        this.context.fillStyle = fill;
    }
    public drawRect(x: number, y: number, w: number, h: number) {
        this.context.beginPath();
        this.context.rect(x, y, w, h);
        this.context.stroke();
    }
    public fillRect(x: number, y: number, w: number, h: number) {
        this.context.fillRect(x, y, w, h);
    }
}
