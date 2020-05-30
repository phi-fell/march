import { promises as fs } from 'fs';
import pug from 'pug';
import { html_pages, pug_locals } from './net/webserver';
import path = require('path');

async function buildPug() {
    await fs.mkdir('site/html', { 'recursive': true });
    for (const page of html_pages) {
        await fs.writeFile(`site/html/${page}.html`, pug.renderFile(path.resolve(`site/pug/${page}.pug`), pug_locals));
    }
}

buildPug();
