import { loadCredentials } from './auth';
import { registerComponent } from './vue_component';

declare var Vue: any;

let app: any;

$(document).ready(async () => {
    await registerComponent(Vue, 'centered_label');
    await registerComponent(Vue, 'game_status_pane');
    await registerComponent(Vue, 'game_sheet_pane');
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
                            'sheet_view': 'attributes',
                            'player': msg.player,
                            'canvas_labels': [
                                {
                                    'text': 'Asdf',
                                    'x': 50,
                                    'y': 10,
                                },
                            ],
                            'chat': {},
                            'social': {},
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
