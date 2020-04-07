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
            socket.on('unfinished_player', (msg: any) => {
                console.log(JSON.parse(JSON.stringify(msg)));
                if (!app) {
                    app = new Vue({
                        'el': '#character_sheet',
                        'data': {
                            'races': [],
                            'traits': [],
                            'trait_choice': '',
                            'sheet': {
                                'name': msg.name,
                                'race': msg.race,
                                'status': msg.status,
                                'traits': msg.traits,
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
                            },
                            'MAX_PLAYERS': 5,
                            'button_disable_override': false,
                        },
                        'mounted': () => {
                            $('#new_player_button').on('click', () => {
                                $('#new_player_button').prop('disabled', true);
                                window.location.href = '/character_creation';
                            });
                        },
                        'methods': {
                            'refreshName': () => {
                                socket.emit('character_creation', { 'action': 'name', 'name': $('#name').text() });
                            },
                            'setRace': () => {
                                socket.emit('character_creation', { 'action': 'race', 'race': app.sheet.race.raceID });
                                socket.emit('get', 'unfinished_player');
                            },
                            'addTrait': () => {
                                socket.emit('character_creation', { 'action': 'add_trait', 'trait': app.trait_choice });
                                socket.emit('get', 'unfinished_player');
                            },
                            'removeTrait': (index: number) => {
                                console.log(index);
                                socket.emit('character_creation', { 'action': 'remove_trait', index });
                                socket.emit('get', 'unfinished_player');
                            },
                            'finish': () => {
                                socket.emit('character_creation', { 'action': 'finish' });
                                app.button_disable_override = true;
                                window.location.href = '/home';
                            },
                        },
                    });
                } else {
                    app.sheet = {
                        'name': msg.name,
                        'race': msg.race,
                        'status': msg.status,
                        'traits': msg.traits,
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
                }
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
