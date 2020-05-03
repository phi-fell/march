import type { VueConstructor } from 'vue';
import { loadCredentials } from './auth.js';
import { EventHandler } from './game/eventhandler.js';
import { Graphics } from './game/graphics.js';
import { Input } from './game/input.js';
import type { Board } from './game/servertypes.js';
import { getSocketDestination } from './socket_destination.js';
import { registerDirectives } from './vue-directives.js';
import { registerComponent } from './vue_component.js';

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
let event_handler: EventHandler | undefined;

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
                            'board': msg.board as Board,
                            'player_entity_id': msg.player_entity,
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
                        },
                        'mounted'() {
                            $('#chat_history').scroll(() => {
                                const el = $('#chat_history');
                                this.chat.autoscroll = Math.ceil((el.scrollTop() || 0) + (el.innerHeight() || 0)) >= el[0].scrollHeight;
                            });
                        },
                        'watch': {
                            'board'(newBoard: Board, oldBoard: Board) {
                                graphics?.setBoard(newBoard);
                            },
                        },
                        'computed': {
                            'player_entity'() {
                                return this.board.entities.find((ent) => ent.id === this.player_entity_id);
                            },
                            'player_sheet'() {
                                return (this as any).player_entity?.components.sheet;
                            },
                            'context_actions'() {
                                return (this as any).board.entities.filter((ent: Entity) => {
                                    return ent.location.x === (this as any).player_entity.location.x &&
                                        ent.location.y === (this as any).player_entity.location.y;
                                }).map(createContextAction).filter((ca: any) => ca !== undefined);
                            }
                        },
                        'methods': {
                            'sendChatMessage': (action: string) => {
                                socket.emit('chat_message', action);
                            },
                        },
                    });
                    input = new Input(socket, app.chat);
                    event_handler = new EventHandler(app, app.chat);
                    socket.on('chat', (chat_msg: string) => {
                        app.chat.messages.push(chat_msg);
                    });
                    socket.on('event', (event: any) => {
                        event_handler?.pushEvent(event);
                    });
                    socket.on('update_data', (json: any) => {
                        console.log('update_data');
                        app.player_entity_id = json.player_entity;
                    });
                    socket.on('palette', (palette: any) => {
                        graphics = new Graphics(
                            $('#tileCanvas')[0] as HTMLCanvasElement,
                            $('#entityCanvas')[0] as HTMLCanvasElement,
                            $('#uiCanvas')[0] as HTMLCanvasElement,
                            app.canvas_labels,
                        );
                        graphics.setBoard(app.board);
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
