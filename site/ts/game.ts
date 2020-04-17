import { loadCredentials } from './auth';
import { Graphics } from './game/graphics';
import { registerComponent } from './vue_component';

declare var Vue: any;

let app: any;

let graphics: Graphics | undefined;

$(document).ready(async () => {
    await registerComponent(Vue, 'centered-label');
    await registerComponent(Vue, 'game_status-pane');
    await registerComponent(Vue, 'game_sheet-pane');
    await registerComponent(Vue, 'game_social-pane');
    await registerComponent(Vue, 'game_chat-pane');
    await registerComponent(Vue, 'game_player-attributes');
    await registerComponent(Vue, 'game_player-race');
    await registerComponent(Vue, 'game_player-skills');
    await registerComponent(Vue, 'game_player-inventory');
    await registerComponent(Vue, 'game_player-equipment');
    await registerComponent(Vue, 'game_player-resource');
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
                            'player_sheet': msg.player_sheet,
                            'player_entity': msg.player_entity,
                            'board': msg.board,
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
                    graphics = new Graphics(
                        $('#tileCanvas')[0] as HTMLCanvasElement,
                        $('#tileCanvas')[0] as HTMLCanvasElement,
                        $('#tileCanvas')[0] as HTMLCanvasElement,
                        app.canvas_labels,
                    );
                } else {
                    console.log('did not recieve valid game_data!');
                    window.location.href = '/home';
                }
            });
            socket.on('game_data_fail', () => {
                console.log('did not recieve game_data!');
                window.location.href = '/home';
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
