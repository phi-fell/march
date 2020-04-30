import { cacheCredentials, Credentials } from './auth.js';
import { getSocketDestination } from './socket_destination.js';

$(() => {
    $('form').submit((e) => {
        e.preventDefault(); // prevents page reloading
        const pass1 = $('#pass1').val();
        const pass2 = $('#pass2').val();
        if (pass1 === pass2) {
            const creds = {
                'user': $('#user').val(),
                'pass': pass1,
            };
            console.log('Creating user...');
            const socket = io(getSocketDestination(), { 'transports': ['websocket'] });
            socket.emit('create_user', creds);
            socket.on('success', (msg: Credentials) => {
                console.log('success! redirecting to /home');
                cacheCredentials(msg);
                window.location.href = '/home';
            });
            socket.on('fail', (msg: any) => {
                console.log('something went wrong');
                if (msg.reason) {
                    alert(msg.reason);
                }
                window.location.href = '/create';
            });
        } else {
            alert('Password fields do not match!');
        }
        return false;
    });
});
