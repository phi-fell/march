import { loadCredentials } from './auth';
import { registerComponent } from './vue_component';

declare var Vue: any;

let app: any;

$(document).ready(async () => {
    await registerComponent(Vue, 'player');
    const creds = loadCredentials();
    if (creds.user && creds.auth) {
        console.log('logging in...');
        const socket = io({ 'transports': ['websocket'] });
        socket.emit('login', creds);
        socket.on('success', () => {
            console.log('valid credentials, loading');
            socket.on('game_data', (msg: any) => {
                if (msg) {
                    app = new Vue({
                        'el': '#game',
                        'data': {
                            'player': msg,
                        },
                        'mounted': () => {
                            // TODO
                        },
                    });
                } else {
                    window.location.href = '/home';
                }
            });
            socket.emit('get', 'game_data');
        });
        socket.on('fail', () => {
            console.log('invalid credentials, redirecting to /login');
            window.location.href = '/login';
        });
    } else {
        console.log('no stored credentials, redirecting to /login');
        window.location.href = '/login';
    }
});
