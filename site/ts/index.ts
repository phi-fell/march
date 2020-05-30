import { clearCredentials, loadCredentials } from './auth.js';
import { getSocketDestination } from './socket_destination.js';

declare var Vue: any;

const splash_text = [
    'NaN% bug free!',
    'May contain traces of JavaScript',
    'Made on shared equipment that also processes C and C++',
    'Ooh Ah Ah Ah Ah!',
];

$(async () => {
    const creds = loadCredentials();
    if (creds.user && creds.auth) {
        console.log('validating stored credentials...');
        const socket = io(getSocketDestination(), { 'transports': ['websocket'] });
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
            'splash_text': (Math.random() < 0.95) ? 'Code by Phi' : (splash_text[Math.floor(Math.random() * splash_text.length)]),
        },
        'methods': {
            clearCredentials,
        },
    });
}
