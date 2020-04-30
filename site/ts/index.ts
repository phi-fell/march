import { clearCredentials, loadCredentials } from './auth.js';

declare var Vue: any;

$(async () => {
    const creds = loadCredentials();
    if (creds.user && creds.auth) {
        console.log('validating stored credentials...');
        const socket = io({ 'transports': ['websocket'] });
        socket.emit('validate', creds);
        socket.on('success', () => {
            console.log('valid credentials');
            return startApp(true, creds.user);
        });
        socket.on('fail', () => {
            console.log('invalid credentials');
            return startApp(false);
        });
    } else {
        console.log('no stored credentials');
        return startApp(false);
    }
});

function startApp(logged_in: boolean, username?: string | undefined) {
    const app = new Vue({
        'el': '#index',
        'data': {
            logged_in,
            username,
        },
        'methods': {
            clearCredentials,
        },
    });
}
