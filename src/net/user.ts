import { Client } from './client';

export enum USER_LOAD_STATE {
    LOADING,
    LOADED,
    UNLOADING,
    UNLOADED,
}

export enum USER_CONNECTION_STATE {
    LOGGING_IN,
    LOGGED_IN,
    LOGGING_OUT,
    LOGGED_OUT,
}

export class User {
    private load_refs: string[] = [];
    private load_state: USER_LOAD_STATE = USER_LOAD_STATE.UNLOADED;
    private connection_state: USER_CONNECTION_STATE = USER_CONNECTION_STATE.LOGGED_OUT;
    private client: Client | null = null;
    constructor() {
        this.loadFromDisk();
    }
    public log_in(client: Client) {
        if (this.connection_state !== USER_CONNECTION_STATE.LOGGED_OUT) {
            console.log('Error: cannot log in user that is already logged in!');
            return;
        }
        this.connection_state = USER_CONNECTION_STATE.LOGGING_IN;
        this.connect(client);
        this.client = client;
        // load player, etc?
        this.connection_state = USER_CONNECTION_STATE.LOGGED_IN;
    }
    public async log_out(client: Client) {
        if (this.connection_state !== USER_CONNECTION_STATE.LOGGED_IN) {
            console.log('Error: cannot log out user that is not logged in!');
            return;
        }
        if (this.client === null || this.client.id !== client.id) {
            console.log('Error: client cannot logout from a user it is not logged in as!');
            return;
        }
        this.connection_state = USER_CONNECTION_STATE.LOGGING_OUT;
        // ^ start logout process (in case of async)
        // TODO: disconnect player and save player to disk, etc.
        // end log out process
        this.client = null;
        this.connection_state = USER_CONNECTION_STATE.LOGGED_OUT;
        this.disconnect(client);
    }
    public connect(client: Client) {
        if (this.load_refs.includes(client.id)) {
            console.log('Error: client cannot connect to a user twice!');
            return;
        }
        this.load_refs.push(client.id);
    }
    public disconnect(client: Client) {
        if (!this.load_refs.includes(client.id)) {
            console.log('Error: client cannot disconnect from a user it is not connected to!');
            return;
        }
        this.load_refs.splice(this.load_refs.indexOf(client.id), 1);
        if (this.client && this.client.id === client.id) {
            this.log_out(client);
        }
    }
    private async loadFromDisk() {
        if (this.load_state !== USER_LOAD_STATE.LOADED) {
            console.log('Error: cannot load user that is already loaded!');
            return;
        }
        this.load_state = USER_LOAD_STATE.LOADING;
        // TODO: load from disk
        this.load_state = USER_LOAD_STATE.LOADED;
    }
    private async unload() {
        if (this.load_state !== USER_LOAD_STATE.LOADED) {
            console.log('Error: cannot unload user that is not loaded!');
            return;
        }
        this.load_state = USER_LOAD_STATE.UNLOADING;
        // TODO: save to disk
        this.load_state = USER_LOAD_STATE.UNLOADED;
    }
}
