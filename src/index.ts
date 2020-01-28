import { promises as fs } from 'fs';

import { WebServer, WebServerOptions } from './net/webserver';

async function main(process_arguments: string[]) {
    const web_options = new WebServerOptions();
    let key: string | Promise<Buffer> = '';
    let cert: string | Promise<Buffer> = '';

    process_arguments.forEach((val, _index, _array) => {
        if (val === '-NO_HTTPS') {
            web_options.use_https = false;
        } else if (val === '-UNLOCK_DIAGNOSTIC') {
            web_options.unlock_diagnostic = true;
        }
    });

    if (web_options.use_https) {
        key = fs.readFile('/etc/letsencrypt/live/gotg.phi.ac/privkey.pem');
        cert = fs.readFile('/etc/letsencrypt/live/gotg.phi.ac/cert.pem');
    }

    web_options.https_key = (await key).toString();
    web_options.https_cert = (await cert).toString();
    const web_server = new WebServer(web_options);
    web_server.listen();
}

main(process.argv);
