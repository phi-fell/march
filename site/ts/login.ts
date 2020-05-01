import { cacheCredentials, Credentials } from './auth.js';
import { getSocketDestination } from './socket_destination.js';

$(() => {
    $('form').submit((e) => {
        e.preventDefault(); // prevents page reloading
        const creds = {
            'user': $('#user').val(),
            'pass': $('#pass').val(),
        };
        console.log('validating credentials...');
        const socket = io(getSocketDestination(), { 'transports': ['websocket'] });
        socket.emit('authorize', creds);
        socket.on('success', (msg: Credentials) => {
            console.log('valid credentials, redirecting to /home');
            cacheCredentials(msg);
            window.location.href = './home';
        });
        socket.on('fail', () => {
            console.log('invalid credentials, redirecting to /login');
            window.location.href = './login';
        });
        return false;
    });
});
