import bent from 'bent';
import cookieParser from 'cookie-parser';
import express, { NextFunction, Request, Response } from 'express';
import http = require('http');
import https = require('https');
import path = require('path');
import pug from 'pug';
import socketIO = require('socket.io');

import { launch_id, version } from '../version';

const DEBUG_MODE = true;

let jqueryjs: string | undefined;
let vuejs: string | undefined;

(async () => {
    try {
        const loadJQuery = bent('https://code.jquery.com', 'string');
        jqueryjs = await (
            DEBUG_MODE
                ? loadJQuery('/jquery-3.4.1.js')
                : loadJQuery('/jquery-3.4.1.min.js')
        );
    } catch (error) {
        console.log('could not GET jquery.js:');
        console.log(error);
    }
    try {
        const loadVue = bent('https://cdn.jsdelivr.net', 'string');
        vuejs = await (
            DEBUG_MODE
                ? loadVue('/npm/vue/dist/vue.js')
                : loadVue('/npm/vue')
        );
    } catch (error) {
        console.log('could not GET vue.js:');
        console.log(error);
    }
})();

export class WebServerOptions {
    public http_port: number = 80;
    public https_port: number = 443;
    public use_https: boolean = true;
    public unlock_diagnostic: boolean = false;
    public https_key: string = '';
    public https_cert: string = '';
    public clone(): WebServerOptions {
        const ret = new WebServerOptions();
        ret.http_port = this.http_port;
        ret.https_port = this.https_port;
        ret.use_https = this.use_https;
        ret.unlock_diagnostic = this.unlock_diagnostic;
        ret.https_key = this.https_key;
        ret.https_cert = this.https_cert;
        return ret;
    }
}

export class WebServer {
    private options: WebServerOptions;
    private express_app: any;
    private redirect_app: any | null = null;
    private http_server: http.Server;
    private https_server: https.Server | null = null;
    private socketIO: SocketIO.Server;
    constructor(opts: WebServerOptions) {
        this.options = opts.clone();
        this.express_app = express();
        this.express_app.use(cookieParser());
        this.express_app.use(express.json());
        if (this.options.use_https) {
            const options = {
                'key': this.options.https_key,
                'cert': this.options.https_cert,
            };

            this.https_server = https.createServer(options, this.express_app);
            this.socketIO = socketIO(this.https_server);

            this.redirect_app = express();
            this.http_server = http.createServer(this.redirect_app);

            this.redirect_app.get('*', (req: Request, res: Response) => {
                res.redirect('https://' + req.headers.host + req.url);
            });
        } else {
            this.http_server = http.createServer(this.express_app);
            this.socketIO = socketIO(this.http_server);
        }
        attachWebRoutes(this.express_app);
    }
    public shutdown() {
        if (this.options.use_https) {
            this.https_server?.close();
            this.http_server.close();
        } else {
            this.http_server.close();
        }
    }
    public listen() {
        if (this.options.use_https) {
            this.https_server?.listen(this.options.https_port, () => {
                console.log('GotG V' + version + ' Launch_ID[' + launch_id + ']');
                console.log('listening on *:' + this.options.https_port);
            });
            this.http_server.listen(this.options.http_port);
        } else {
            this.http_server.listen(this.options.http_port, () => {
                console.log('GotG V' + version + ' Launch_ID[' + launch_id + ']');
                console.log('listening on *:' + this.options.http_port);
            });
        }
    }
    public getSocketIO() {
        return this.socketIO;
    }
}

function attachWebRoutes(app: any) {
    app.get('/', (req: Request, res: Response) => {
        res.send(pug.renderFile(path.resolve('site/pug/index.pug')));
    });

    app.get('/dependencies/jquery.js', async (req: Request, res: Response) => {
        if (jqueryjs) {
            res.send(jqueryjs);
        } else {
            res.sendFile(path.resolve('dev_fallback/jquery.js'));
        }
    });
    app.get('/dependencies/vue(.js)?', async (req: Request, res: Response) => {
        if (vuejs) {
            res.type('application/javascript').send(vuejs);
        } else {
            res.sendFile(path.resolve('dev_fallback/vue.js'));
        }
    });

    app.get('/favicon.ico', (req: Request, res: Response) => {
        res.sendFile(path.resolve('site/logo/favicon.ico'));
    });

    app.get('/test', (req: Request, res: Response) => {
        res.send(pug.renderFile(path.resolve('site/pug/test.pug')));
    });
    app.get('/game', (req: Request, res: Response) => {
        res.sendFile(path.resolve('site/html/game.html'));
    });
    app.get('/login', (req: Request, res: Response) => {
        res.send(pug.renderFile(path.resolve('site/pug/login.pug')));
    });
    app.get('/home', (req: Request, res: Response) => {
        res.send(pug.renderFile(path.resolve('site/pug/home.pug')));
    });
    app.get('/character_creation', (req: Request, res: Response) => {
        res.send(pug.renderFile(path.resolve('site/pug/character_creation.pug')));
    });
    app.get('/create', (req: Request, res: Response) => {
        res.send(pug.renderFile(path.resolve('site/pug/new.pug')));
    });

    app.use('/js', (req: Request, res: Response, next: NextFunction) => {
        res.sendFile(path.resolve('site/js' + req.path + (req.path.endsWith('.js') ? '' : '.js')));
    });
    app.use('/vue', (req: Request, res: Response, next: NextFunction) => {
        res.send(pug.renderFile(path.resolve('site/vue/' + req.path + '.pug')));
    });

    app.use('/tex', express.static(path.resolve('site/tex')));
    app.use(express.static(path.resolve('public')));
}
