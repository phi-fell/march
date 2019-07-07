function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}
function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999;';
}
function clearCredentials() {
    eraseCookie('user');
    eraseCookie('pass');
}
function setCacheTime(days) {
    setCookie('user', getCookie('user'), days);
    setCookie('pass', getCookie('pass'), days);
}
function cacheCredentials(user, pass, days) {
    if (!days) {
        days = 3;
    }
    setCookie('user', user, days);
    setCookie('pass', pass, days);
}
function cacheUser(user) {
    setCookie('user', user, 3);
}
function loadCredentials() {
    return {
        user: getCookie('user'),
        pass: getCookie('pass'),
    };
}