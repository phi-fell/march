import { ACTION_TYPE } from './actiontype';

export abstract class ActionBase {
    public abstract type: ACTION_TYPE;
    public toJSON(): object {
        return { 'type': ACTION_TYPE[this.type] };
    }
}
