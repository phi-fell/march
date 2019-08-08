function loadJS(name) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'js/' + name + '.js';
    head.appendChild(script);
}