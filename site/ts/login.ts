import { cacheCredentials, Credentials } from './auth';

$(() => {
    $('form').submit((e) => {
        e.preventDefault(); // prevents page reloading
        const creds = {
            'user': $('#user').val(),
            'pass': $('#pass').val(),
        };
        console.log('validating credentials...');
        const socket = io();
        socket.emit('authorize', creds);
        socket.on('success', (msg: Credentials) => {
            console.log('valid credentials, redirecting to /game');
            cacheCredentials(msg);
            window.location.href = '/game';
        });
        socket.on('fail', () => {
            console.log('invalid credentials, redirecting to /login');
            window.location.href = '/login';
        });
        return false;
    });
});
