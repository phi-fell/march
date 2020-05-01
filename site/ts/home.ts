import { loadCredentials } from './auth.js';
import { getSocketDestination } from './socket_destination.js';
import { registerComponent } from './vue_component.js';

declare var Vue: any;

let app: any;

$(document).ready(async () => {
    await registerComponent(Vue, 'player');
    const creds = loadCredentials();
    if (creds.user && creds.auth) {
        console.log('logging in...');
        const socket = io(getSocketDestination(), { 'transports': ['websocket'] });
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
                            };
                            return plr;
                        }),
                        'MAX_PLAYERS': 5,
                    },
                    'mounted': () => {
                        $('#new_player_button').on('click', () => {
                            $('#new_player_button').prop('disabled', true);
                            window.location.href = './character_creation';
                        });
                    },
                });
            });
            socket.on('active_player_response', (resp: any) => {
                if (resp) {
                    if (resp.success) {
                        console.log('active player set, redirecting to game');
                        window.location.href = './game';
                    } else {
                        console.log(resp.msg);
                        alert('Could not set player!\nServer response: ' + resp.msg + '\nThis is likely a bug, try refreshing the page, and consider submitting an issue on our github page (especially if this happens multiple times).');
                    }
                } else {
                    const s = 'Could not set player! Empty response recieved! This is likely a bug, try refreshing the page, and consider submitting an issue on our github page (especially if this happens multiple times).';
                    console.log(s);
                    alert(s);
                }
            });
            socket.emit('get', 'players');
        });
        socket.on('fail', () => {
            console.log('invalid credentials, redirecting to /login');
            window.location.href = './login';
        });
    } else {
        console.log('no stored credentials, redirecting to /login');
        window.location.href = './login';
    }
});
