import type { VueConstructor } from 'vue';
import { loadCredentials } from './auth.js';
import { getSocketDestination } from './socket_destination.js';
import { registerDirectives } from './vue-directives.js';
import { registerComponent } from './vue_component.js';

declare var Vue: VueConstructor;

let app: any;

$(document).ready(async () => {
    registerDirectives(Vue);
    await registerComponent(Vue, 'centered-label');
    const creds = loadCredentials();
    if (creds.user && creds.auth) {
        console.log('logging in...');
        const socket = io(getSocketDestination(), { 'transports': ['websocket'] });
        socket.emit('login', creds);
        socket.on('success', () => {
            console.log('valid credentials, loading');
            socket.on('diagnostic_data', async (msg: any) => {
                if (msg) {
                    app = new Vue({
                        'el': '#diagnostic',
                        'data': {
                            'loading': true,
                        },
                    });
                } else {
                    console.log('did not recieve valid diagnostic_data!');
                    window.location.href = './home.html';
                }
            });
            socket.on('diagnostic_data_fail', () => {
                console.log('did not recieve diagnostic_data!');
                window.location.href = './home.html';
            });
            socket.emit('get', 'diagnostic_data');
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
