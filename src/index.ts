import { promises as fs } from 'fs';
import * as t from 'io-ts';
import { Server } from './net/server';
import { WebServer, WebServerOptions } from './net/webserver';
import { runCommand } from './system/commandline';
import { File } from './system/file';
import { World, WorldSchema } from './world/world';

const ssl_paths_schema = t.type({
    'root': t.string,
    'key': t.string,
    'cert': t.string,
});
type SSL_Paths = t.TypeOf<typeof ssl_paths_schema>;

async function main(process_arguments: string[]) {
    const web_options = new WebServerOptions();
    const ssl_paths: SSL_Paths | undefined = await (async () => {
        try {
            const json: any = (await File.getReadOnlyFile('config/https.json')).getJSON();
            if (json && ssl_paths_schema.is(json)) {
                return json;
            }
        } catch {
            // return undefined
        }
    })();
    let key: string | Promise<Buffer> = '';
    let cert: string | Promise<Buffer> = '';

    process_arguments.forEach((val, _index, _array) => {
        if (val === '-NO_HTTPS') {
            web_options.use_https = false;
        } else if (val === '-UNLOCK_DIAGNOSTIC') {
            web_options.unlock_diagnostic = true;
        } else if (val === '-JS_DEBUG_LIBS') {
            web_options.useDebugJS = true;
        } else if (val === '-STATIC_SITE') {
            web_options.static_site = true;
        }
    });

    const worldFilePath = 'world/world.json';
    const worldFile = await File.acquireFile(worldFilePath);
    if (!await File.exists(worldFilePath)) {
        console.log('Could not find world! creating new world...');
        const json: WorldSchema = {
            'instances': [],
        };
        worldFile.setJSON(json);
    }
    const world = World.loadWorldFromFile(worldFile);

    if (web_options.use_https) {
        if (ssl_paths !== undefined) {
            key = fs.readFile(ssl_paths.root + ssl_paths.key);
            cert = fs.readFile(ssl_paths.root + ssl_paths.cert);
        } else {
            throw new Error('No paths to SSL certificate! Did you run setup_prod.sh?')
        }
    }

    web_options.https_key = (await key).toString();
    web_options.https_cert = (await cert).toString();
    const web_server = new WebServer(web_options);
    const io_server = new Server(web_server.getSocketIO(), await world);

    const graceful_exit = async () => {
        process.stdout.write('Shutting down...\n');
        await io_server.shutdown();
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
    io_server.run();

    const stdin = process.openStdin();
    stdin.addListener('data', (d) => { // TODO: swtich to nodejs readline module?
        runCommand(d.toString().trim(), process.stdout, graceful_exit);
    });
}

main(process.argv);
