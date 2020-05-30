import { promises as fs } from 'fs';
import pug from 'pug';
import { pug_locals } from './net/webserver';
import path = require('path');

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
