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
            socket.on('players', (msg: any[]) => {
                app = new Vue({
                    'el': '#home',
                    'data': {
                        'players': msg.map((plr, index) => {
                            plr.play = () => {
                                socket.emit('set_active_player', index);
                                window.location.href = '/game';
                            };
                            return plr;
                        }),
                        'MAX_PLAYERS': 5,
                    },
                    'mounted': () => {
                        $('#new_player_button').on('click', () => {
                            $('#new_player_button').prop('disabled', true);
                            window.location.href = '/character_creation';
                        });
                    },
                });
            });
            socket.emit('get', 'players');
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
