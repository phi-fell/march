import { Action } from './action';

export interface Controller {
    getNextAction(): Action;
}
