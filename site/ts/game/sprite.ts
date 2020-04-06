
import { GraphicsContext } from './graphicscontext';
export class Sprite {
    private loaded: boolean = false;
    private image: HTMLImageElement = new Image();
    constructor(id: string) {
        const sprite = this;
        sprite.image.onload = () => {
            sprite.loaded = true;
        };
        sprite.image.src = 'tex/sprites/' + id + '.png';
    }
    public draw(context: GraphicsContext) {
        if (!this.loaded) {
            context.push();
            context.color('#F0F');
            context.fillRect(-0.5, -0.5, 1, 1);
            context.pop();
        } else {
            context.drawImage(this.image, -0.5, -0.5, 1, 1);
        }
    }
}

