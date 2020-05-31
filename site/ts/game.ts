import type { VueConstructor } from 'vue';
import { loadCredentials } from './auth.js';
import { EventHandler } from './game/eventhandler.js';
import { Graphics } from './game/graphics.js';
import { Input } from './game/input.js';
import type { Board, Entity } from './game/servertypes.js';
import { getSocketDestination } from './socket_destination.js';
import { sleep } from './util.js';
import { registerDirectives } from './vue-directives.js';
import { registerComponent } from './vue_component.js';

const MIN_LOAD_TIME = 500;

declare var Vue: VueConstructor;

let app: any;

let graphics: Graphics | undefined;
let input: Input | undefined;
let event_handler: EventHandler | undefined;

$(document).ready(async () => {
    registerDirectives(Vue);
    await Promise.all([
        registerComponent(Vue, 'centered-label'),
        registerComponent(Vue, 'settings-menu'),
        registerComponent(Vue, 'settings_controls'),
        registerComponent(Vue, 'game_status-pane'),
        registerComponent(Vue, 'game_sheet-pane'),
        registerComponent(Vue, 'game_context-pane'),
        registerComponent(Vue, 'game_social-pane'),
        registerComponent(Vue, 'game_chat-pane'),
        registerComponent(Vue, 'game_player-attributes'),
        registerComponent(Vue, 'game_player-race'),
        registerComponent(Vue, 'game_player-skills'),
        registerComponent(Vue, 'game_player-inventory'),
        registerComponent(Vue, 'game_player-equipment'),
        registerComponent(Vue, 'game_player-resource'),
    ]);
    const creds = loadCredentials();
    if (creds.user && creds.auth) {
        console.log('logging in...');
        const socket = io(getSocketDestination(), { 'transports': ['websocket'] });
        socket.emit('login', creds);
        socket.on('success', () => {
            console.log('valid credentials, loading');
            socket.on('game_data', async (msg: any) => {
                if (msg) {
                    app = new Vue({
                        'el': '#game',
                        'data': {
                            'loading': true,
                            'load_start': Date.now(),
                            'sheet_view': 'attributes',
                            'settings_visible': false,
                            'settings_view': 'controls',
                            'settings': { 'controls': 5 },
                            'board': msg.board as Board,
                            'entities': msg.entities as Entity[],
                            'player_entity_id': msg.player_entity,
                            'canvas_labels': [/*
                                {
                                    'text': 'Asdf',
                                    'x': 50,
                                    'y': 10,
                                },*/
                            ],
                            'chat': {
                                'autoscroll': true,
                                'messages': msg.messages as string[],
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
                        'computed': {
                            'player_entity'() {
                                return this.entities.find((ent) => ent.id === this.player_entity_id);
                            },
                            'player_sheet'() {
                                return (this as any).player_entity?.components.sheet;
                            },
                            'context_actions'() {
                                if ((this as any).player_entity === undefined) {
                                    return [];
                                }
                                return this.entities.filter((ent: Entity) => {
                                    return ent.location.x === (this as any).player_entity.location.x &&
                                        ent.location.y === (this as any).player_entity.location.y;
                                }).map(createContextAction).filter((ca: any) => ca !== undefined);
                            }
                        },
                        'methods': {
                            'startLoad'() {
                                this.load_start = Date.now();
                                this.loading = true;
                            },
                            async 'endLoad'() {
                                if (Date.now() - this.load_start < MIN_LOAD_TIME) {
                                    await sleep(MIN_LOAD_TIME - (Date.now() - this.load_start));
                                }
                                this.loading = false;
                            },
                            'setSheetView'(view: string) {
                                this.sheet_view = view;
                            },
                            'toggleSettings'() {
                                console.log('toggled!');
                                this.settings_visible = !this.settings_visible;
                            },
                            'setSettingsView'(view: string) {
                                this.settings_view = view;
                            },
                            'sendChatMessage': (action: string) => {
                                socket.emit('chat_message', action);
                            },
                        },
                    });
                    graphics = new Graphics(
                        $('#tileCanvas')[0] as HTMLCanvasElement,
                        $('#entityCanvas')[0] as HTMLCanvasElement,
                        $('#unseenCanvas')[0] as HTMLCanvasElement,
                        $('#fogCanvas')[0] as HTMLCanvasElement,
                        $('#uiCanvas')[0] as HTMLCanvasElement,
                        app,
                    );
                    graphics.setPalette(msg.palette);
                    graphics.startDrawLoop();
                    event_handler = new EventHandler(graphics, app, app.chat);
                    input = new Input(socket, event_handler, app);
                    await app.endLoad();
                    event_handler.startEventProcessingLoop();
                    socket.on('chat', (chat_msg: string) => {
                        app.chat.messages.push(chat_msg);
                    });
                    socket.on('event', (event: any) => {
                        event_handler?.pushEvent(event);
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
    if (e.components.portal !== undefined) {
        return {
            'text': 'Stairs',
            'btn_text': 'Climb',
            'action': `#use_portal ${e.id}`,
        }
    }
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
