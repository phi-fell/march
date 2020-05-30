import { promises as fs } from 'fs';
import pug from 'pug';
import { version } from './version';
import path = require('path');

const pug_locals = {
    'jquery_path': 'https://code.jquery.com/jquery-3.4.1.min.js',
    'vue_path': 'https://cdn.jsdelivr.net/npm/vue',
    'socket_io_path': 'https://gotg.io/socket.io/socket.io.js',
    'github_link': 'https://github.com/phi-fell/march',
    'bug_link': 'https://github.com/phi-fell/march/issues',
    'version_string': 'V' + version,
};

async function buildPug(input_dir: string = 'site/pug', output_dir = 'site/html') {
    await fs.mkdir(output_dir, { 'recursive': true });
    const filenames = await fs.readdir(input_dir);
    filenames.forEach(async (filename) => {
        try {
            const stat = await fs.stat(input_dir + '/' + filename);
            if (stat.isDirectory()) {
                buildPug(input_dir + '/' + filename, output_dir + '/' + filename)
            } else {
                await fs.writeFile(
                    `${output_dir}/${filename.replace('.pug', '.html')}`,
                    pug.renderFile(path.resolve(`${input_dir}/${filename}`), pug_locals)
                );
            }
        } catch (err) {
            console.log(err);
        }
    });
}

buildPug();
