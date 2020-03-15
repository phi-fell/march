import { loadCredentials } from './auth';
import { registerDirectives } from './vue-directives';
import { registerComponent } from './vue_component';

declare var Vue: any;

let app: any;

function make_cnum(name: string, value: number, increment?: (id: string) => any, decrement?: (id: string) => any) {
    return {
        name,
        value,
        'increment': increment ? (() => increment(name)) : undefined,
        'decrement': decrement ? (() => decrement(name)) : undefined,
    };
}

function incrementSkill(name: string) {
    console.log('Skills[' + name + ']++');
}
function decrementSkill(name: string) {
    console.log('Skills[' + name + ']--');
}

$(document).ready(async () => {
    registerDirectives(Vue);
    await registerComponent(Vue, 'cnum', ['self', 'override']);
    const creds = loadCredentials();
    if (creds.user && creds.auth) {
        console.log('logging in...');
        const socket = io({ 'transports': ['websocket'] });
        socket.emit('login', creds);
        socket.on('success', () => {
            console.log('valid credentials, loading');
            app = new Vue({
                'el': '#character_sheet',
                'data': {
                    'sheet': {
                        'attributes': [],
                        'skills': [],
                        'essence': 0,
                    },
                    'MAX_PLAYERS': 5,
                    'button_disable_override': true,
                },
                'mounted': () => {
                    $('#new_player_button').on('click', () => {
                        $('#new_player_button').prop('disabled', true);
                        window.location.href = '/character_creation';
                    });
                },
            });
            socket.on('unfinished_player', (msg: any) => {
                console.log(JSON.parse(JSON.stringify(msg)));
                app.sheet = {
                    'attributes': Object.keys(msg.attributes).map((name: string) => {
                        return make_cnum(
                            name,
                            msg.attributes[name],
                            (msg.attributeLevelupCosts[name] <= msg.essence)
                                ? ((attr: string) => {
                                    app.button_disable_override = true;
                                    socket.emit('character_creation', { 'action': 'increment_attribute', 'attribute': attr });
                                    socket.emit('get', 'unfinished_player');
                                })
                                : undefined,
                            (msg.attributes[name] > 0)
                                ? ((attr: string) => {
                                    app.button_disable_override = true;
                                    socket.emit('character_creation', { 'action': 'decrement_attribute', 'attribute': attr });
                                    socket.emit('get', 'unfinished_player');
                                })
                                : undefined);
                    }),
                    'skills': Object.keys(msg.skills).map((name: string) => {
                        return make_cnum(name, msg.skills[name], incrementSkill, decrementSkill);
                    }),
                    'essence': msg.essence,
                };
                app.button_disable_override = false;
            });
            socket.on('available_races', (msg: any) => {
                app.races = msg;
            });
            socket.on('available_traits', (msg: any) => {
                app.traits = msg;
            });
            socket.emit('get', 'unfinished_player');
            socket.emit('get', 'available_races');
            socket.emit('get', 'available_traits');
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
