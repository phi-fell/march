export async function registerComponent(v: any, component: string, props: string[] = ['self']) {
    return new Promise((res, _rej) => {
        $.get(`./vue/${component.replace('_', '/')}.html`, (template) => {
            v.component(component, {
                props,
                template,
            });
            res();
        });
    });
}
