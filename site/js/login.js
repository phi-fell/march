$(function () {
    $('form').submit(function (e) {
        e.preventDefault(); // prevents page reloading
        creds = {
            user: $('#user').val(),
            pass: $('#pass').val(),
        };
        console.log('validating credentials...');
        var socket = io();
        socket.emit('authorize', creds);
        socket.on('success', function (msg) {
            console.log('valid credentials, redirecting to /game');
            cacheCredentials(msg)
            window.location.href = '/game';
        });
        socket.on('fail', function (msg) {
            console.log('invalid credentials, redirecting to /login');
            window.location.href = '/login';
        });
        return false;
    });
});