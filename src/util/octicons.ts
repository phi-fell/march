import { promises as fs } from 'fs';
import octicons = require('@primer/octicons');

export async function buildAllOcticons(dir: string = 'dist/svg/octicon') {
    for (const name of ['person', 'sign-in', 'home', 'mark-github', 'bug'] as const) {
        const icon = octicons[name];
        if (icon) {
            await fs.mkdir(dir, { 'recursive': true })
            await fs.writeFile(`${dir}/${name}.svg`, icon.toSVG({
                'xmlns': 'http://www.w3.org/2000/svg',
                'fill': '#CCC',
            }));
        } else {
            console.log(`no such octicon as ${name}!`);
        }
    }
}
