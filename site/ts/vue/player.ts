export function registerPlayerComponent(v: any) {
    $.get('/vue/player.html', (template) => {
        v.component('player', {
            'props': ['player'],
            template,
        });
    });
}
