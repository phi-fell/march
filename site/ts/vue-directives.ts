export function registerDirectives(v: any) {
    v.directive('visible', (el: any, binding: any) => {
        el.style.visibility = (!!binding.value) ? 'visible' : 'hidden';
    });
    v.directive('autoscroll', {
        'bind': (el: any, binding: any) => {
            if (binding.value) {
                el.scrollTop = el.scrollHeight;
            }
        },
        'componentUpdated': (el: any, binding: any) => {
            if (binding.value) {
                el.scrollTop = el.scrollHeight;
            }
        },
    });
}
