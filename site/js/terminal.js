$(function () {
    $('#console')[0].style.paddingRight = $('#console')[0].offsetWidth - $('#console')[0].clientWidth + "px";
    document.addEventListener('keypress', keypress);
    document.addEventListener('keydown', keydown);
    draw();
});

let buffer = "";
let command = "";
let entered = "";
let history = [];
let hpos = 0;

function prefix() {
    const d = new Date()
    return ("[" + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + "] gotg> ");
}

function keydown(e) {
    if (e.which === 8) {
        command = command.substring(0, command.length - 1);
        draw();
    } else if (e.which === 38) {
        console.log('up');
        if (hpos > 0) {
            if (hpos === history.length) {
                entered = command;
            }
            hpos--;
            command = history[hpos];
            draw();
        }
    } else if (e.which === 40) {
        console.log('down');
        if (hpos < history.length) {
            hpos++;
            if (hpos === history.length) {
                command = entered;
            } else {
                command = history[hpos];
            }
            draw();
        }
    }
}

function keypress(e) {
    if (e.which === 13) {
        if (command.length) {
            pushCmd();
        }
    } else {
        command += (String.fromCharCode(e.which));
        draw();
    }
}

function pushCmd() {
    sendCMD(command);
    history.push(command);
    hpos = history.length;
    buffer += prefix() + command + "\n";
    command = "";
    draw();
}

function draw() {
    const autoscroll = (Math.ceil($('#console').scrollTop() + $('#console').innerHeight()) >= $('#console')[0].scrollHeight);
    $('#log').text(buffer + prefix() + command);
    if (autoscroll) { $('#console').scrollTop($('#console')[0].scrollHeight); }
}

function sendCMD(cmd) {
    $.ajax({
        url: '/terminal',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            'cmd': cmd,
        }),
        success: (data) => {
            console.log(data);
            if (data.result) {
                buffer += data.result + '\n';
                draw();
            }
        },
        dataType: 'json',
    });
}