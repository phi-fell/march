import { loadCredentials } from './auth';
import { registerPlayerComponent } from './vue/player';

declare var Vue: any;

let app: any;

registerPlayerComponent(Vue);

$(document).ready(() => {
    const creds = loadCredentials();
    if (creds.user && creds.auth) {
        console.log('logging in...');
        const socket = io();
        socket.emit('login', creds);
        socket.on('success', () => {
            console.log('valid credentials, loading');
            socket.on('players', (msg: any[]) => {
                console.log(msg);
                app = new Vue({
                    'el': '#home',
                    'data': {
                        'players': msg,
                        'new_player_name': '',
                    },
                    'mounted': () => {
                        $('#new_player_button').on('click', () => {
                            $('#new_player_button').prop('disabled', true);
                            socket.emit('new_player', app.new_player_name);
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
