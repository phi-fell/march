import { loadCredentials } from './auth';

$(() => {
    const creds = loadCredentials();
    if (creds.user && creds.auth) {
        console.log('validating stored credentials...');
        const socket = io();
        socket.emit('validate', creds);
        socket.on('success', () => {
            console.log('valid credentials, redirecting to /home');
            window.location.href = '/home';
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
