import type { VueConstructor } from 'vue';
import { loadCredentials } from './auth.js';
import { Graphics } from './game/graphics.js';
import { Input } from './game/input.js';
import { getSocketDestination } from './socket_destination.js';
import { registerDirectives } from './vue-directives.js';
import { registerComponent } from './vue_component.js';

interface GameEvent {
    type: any;
    message: string;
}

interface Entity {
    id: string;
    location: {
        x: number;
        y: number;
    };
    components: {
        item_data?: {
            name: string;
            stackable: boolean;
            count: number;
        };
    };
}

declare var Vue: VueConstructor;

let app: any;

let graphics: Graphics | undefined;
let input: Input | undefined;

$(document).ready(async () => {
    registerDirectives(Vue);
    await registerComponent(Vue, 'centered-label');
    await registerComponent(Vue, 'game_status-pane');
    await registerComponent(Vue, 'game_sheet-pane');
    await registerComponent(Vue, 'game_context-pane');
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
        const socket = io(getSocketDestination(), { 'transports': ['websocket'] });
        socket.emit('login', creds);
        socket.on('success', () => {
            console.log('valid credentials, loading');
            socket.on('game_data', (msg: any) => {
                if (msg) {
                    socket.emit('get', 'palette');
                    app = new Vue({
                        'el': '#game',
                        'data': {
                            'sheet_view': 'attributes',
                            'player_sheet': msg.player_sheet,
                            'player_entity': msg.player_entity,
                            'canvas_labels': [
                                {
                                    'text': 'Asdf',
                                    'x': 50,
                                    'y': 10,
                                },
                            ],
                            'chat': {
                                'autoscroll': true,
                                'messages': [] as string[],
                                'current_message': '',
                                'typing': false,
                            },
                            'social': {},
                            'context_actions': [],
                        },
                        'mounted'() {
                            $('#chat_history').scroll(() => {
                                const el = $('#chat_history');
                                this.chat.autoscroll = Math.ceil((el.scrollTop() || 0) + (el.innerHeight() || 0)) >= el[0].scrollHeight;
                            });
                        },
                        'methods': {
                            'sendChatMessage': (action: string) => {
                                socket.emit('chat_message', action);
                            },
                        },
                    });
                    input = new Input(socket, app.chat);
                    socket.on('chat', (chat_msg: string) => {
                        app.chat.messages.push(chat_msg);
                    });
                    socket.on('event', (event: GameEvent) => {
                        app.chat.messages.push(event.message);
                    });
                    socket.on('update_data', (json: any) => {
                        app.player_sheet = json.player_sheet;
                        app.player_entity = json.player_entity;
                        graphics?.setBoard(json.board);
                        app.context_actions = json.board.entities.filter((ent: Entity) => {
                            return ent.location.x === app.player_entity.location.x && ent.location.y === app.player_entity.location.y;
                        }).map(createContextAction).filter((ca: any) => ca !== undefined);
                    });
                    socket.on('palette', (palette: any) => {
                        graphics = new Graphics(
                            $('#tileCanvas')[0] as HTMLCanvasElement,
                            $('#entityCanvas')[0] as HTMLCanvasElement,
                            $('#uiCanvas')[0] as HTMLCanvasElement,
                            app.canvas_labels,
                        );
                        graphics.setBoard(msg.board);
                        app.context_actions = msg.board.entities.filter((ent: Entity) => {
                            return ent.location.x === app.player_entity.location.x && ent.location.y === app.player_entity.location.y;
                        }).map(createContextAction).filter((ca: any) => ca !== undefined);
                        graphics.setPalette(palette);
                        graphics.startDrawLoop();
                    });
                } else {
                    console.log('did not recieve valid game_data!');
                    window.location.href = './home.html';
                }
            });
            socket.on('game_data_fail', () => {
                console.log('did not recieve game_data!');
                window.location.href = './home.html';
            });
            socket.emit('get', 'game_data');
        });
        socket.on('fail', () => {
            console.log('invalid credentials, redirecting to /login');
            window.location.href = './login.html';
        });
    } else {
        console.log('no stored credentials, redirecting to /login');
        window.location.href = './login.html';
    }
});

function createContextAction(e: Entity) {
    if (e.components.item_data !== undefined) {
        const item = e.components.item_data;
        return {
            'text': (item.stackable) ? (`${item.count} ${item.name}`) : (item.name),
            'btn_text': 'Pick Up',
            'action': `#pickup ${e.id}`,
        }
    }
    return;
}
