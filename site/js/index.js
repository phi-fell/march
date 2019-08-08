$(function () {
    creds = loadCredentials();
    if (creds.user && creds.auth) {
        console.log('validating stored credentials...');
        var socket = io();
        socket.emit('validate', creds);
        socket.on('success', function (msg) {
            console.log('valid credentials, redirecting to /game');
            window.location.href = '/game';
        });
        socket.on('fail', function (msg) {
            console.log('invalid credentials, redirecting to /login');
            window.location.href = '/login';
        });
    } else {
        console.log('no stored credentials, redirecting to /login');
        window.location.href = '/login';
    }
});