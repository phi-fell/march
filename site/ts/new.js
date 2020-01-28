$(function () {
    $('form').submit(function (e) {
        e.preventDefault(); // prevents page reloading
        var pass1 = $('#pass1').val();
        var pass2 = $('#pass2').val();
        if (pass1 === pass2) {
            creds = {
                user: $('#user').val(),
                pass: pass1,
            };
            console.log('Creating user...');
            var socket = io();
            socket.emit('create_user', creds);
            socket.on('success', function (msg) {
                console.log('success! redirecting to /character_creation');
                cacheCredentials(msg)
                window.location.href = '/character_creation';
            });
            socket.on('fail', function (msg) {
                console.log('something went wrong');
                if (msg.reason) {
                    alert(msg.reason);
                }
                window.location.href = '/create';
            });
        } else {
            alert("Password fields do not match!");
        }
        return false;
    });
});