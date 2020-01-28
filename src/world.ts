export class World {
    public static async getWorld(id: string): Promise<World | null> {
        return World.getLoadedWorld(id) || World.loadWorld(id);
    }
    private static worlds: { [id: string]: World; } = {};
    private static async loadWorld(id: string): Promise<World | null> {
        return null; // TODO: load World from disk
    }
    private static getLoadedWorld(id: string): World | null {
        return World.worlds[id] || null;
    }
    constructor(private _x: number, private _y: number, private _instance_id: string) {
    }
    get instance_id(): string {
        return this._instance_id;
    }
    public save() {
        // TODO: save to disk
    }
}
