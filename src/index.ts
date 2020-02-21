import { promises as fs } from 'fs';

import { Server } from './net/server';
import { WebServer, WebServerOptions } from './net/webserver';
import { runCommand } from './system/commandline';

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
    const io_server = new Server(web_server.getSocketIO());

    const graceful_exit = () => {
        process.stdout.write('Shutting down...  ');
        io_server.shutdown();
        web_server.shutdown();
        process.stdout.write('done\n');
        process.exit();
    };

    process.on('SIGINT', async () => {
        console.log('\nSIGINT received.');
        graceful_exit();
    });
    process.on('SIGTERM', async () => {
        console.log('\nSIGTERM received.');
        graceful_exit();
    });

    web_server.listen();

    const stdin = process.openStdin();
    stdin.addListener('data', (d) => { // TODO: swtich to nodejs readline module?
        runCommand(d.toString().trim(), process.stdout, graceful_exit);
    });
}

main(process.argv);
