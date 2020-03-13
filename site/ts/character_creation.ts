import { loadCredentials } from './auth';
import { registerComponent } from './vue_component';

declare var Vue: any;

let app: any;

function make_cnum(name: string, value: number, increment: (id: string) => any, decrement: (id: string) => any) {
    return {
        name,
        value,
        'increment': () => increment(name),
        'decrement': () => decrement(name),
    };
}

function incrementAttribute(name: string) {
    console.log('Attributes[' + name + ']++');
}
function decrementAttribute(name: string) {
    console.log('Attributes[' + name + ']--');
}

function incrementSkill(name: string) {
    console.log('Skills[' + name + ']++');
}
function decrementSkill(name: string) {
    console.log('Skills[' + name + ']--');
}

$(document).ready(async () => {
    await registerComponent(Vue, 'cnum', ['self', 'override']);
    const creds = loadCredentials();
    if (creds.user && creds.auth) {
        console.log('logging in...');
        const socket = io();
        socket.emit('login', creds);
        socket.on('success', () => {
            console.log('valid credentials, loading');
            app = new Vue({
                'el': '#character_sheet',
                'data': {
                    'sheet': {
                        'attributes': [],
                        'skills': []
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
                        return make_cnum(name, msg.attributes[name], incrementAttribute, decrementAttribute);
                    }),
                    'skills': Object.keys(msg.skills).map((name: string) => {
                        return make_cnum(name, msg.skills[name], incrementSkill, decrementSkill);
                    }),
                };
                app.button_disable_override = false;
            });
            socket.emit('get', 'unfinished_player');
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
