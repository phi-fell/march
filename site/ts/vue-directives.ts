export function registerDirectives(v: any) {
    v.directive('visible', (el: any, binding: any) => {
        el.style.visibility = (!!binding.value) ? 'visible' : 'hidden';
    });
}
