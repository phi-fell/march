import { OnError } from './onerror';

export const NoThrow = OnError((error) => {
    console.log('NoThrow function threw an Error!: ' + error);
});
