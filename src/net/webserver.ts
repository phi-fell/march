import bent from 'bent';
import cookieParser from 'cookie-parser';
import express, { NextFunction, Request, Response } from 'express';
import http = require('http');
import https = require('https');
import path = require('path');
import pug from 'pug';
import octicons = require('@primer/octicons');
import socketIO = require('socket.io');

import { launch_id, version } from '../version';

export class WebServerOptions {
    public http_port: number = 80;
    public https_port: number = 443;
    public use_https: boolean = true;
    public unlock_diagnostic: boolean = false;
    public useDebugJS: boolean = false;
    public https_key: string = '';
    public https_cert: string = '';
    public clone(): WebServerOptions {
        const ret = new WebServerOptions();
        ret.http_port = this.http_port;
        ret.https_port = this.https_port;
        ret.use_https = this.use_https;
        ret.unlock_diagnostic = this.unlock_diagnostic;
        ret.useDebugJS = this.useDebugJS;
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
    private jqueryjs: string | undefined;
    private vuejs: string | undefined;
    constructor(opts: WebServerOptions) {
        this.options = opts.clone();
        const ws = this;
        (async () => {
            try {
                const loadJQuery = bent('https://code.jquery.com', 'string');
                ws.jqueryjs = await (
                    (ws.options.useDebugJS)
                        ? loadJQuery('/jquery-3.4.1.js')
                        : loadJQuery('/jquery-3.4.1.min.js')
                );
            } catch (error) {
                console.log('could not GET jquery.js:');
                console.log(error);
            }
            try {
                const loadVue = bent('https://cdn.jsdelivr.net', 'string');
                ws.vuejs = await (
                    (ws.options.useDebugJS)
                        ? loadVue('/npm/vue/dist/vue.js')
                        : loadVue('/npm/vue')
                );
            } catch (error) {
                console.log('could not GET vue.js:');
                console.log(error);
            }
        })();
        this.express_app = express();
        this.express_app.use(cookieParser());
        this.express_app.use(express.json());
        if (this.options.use_https) {
            const options = {
                'key': this.options.https_key,
                'cert': this.options.https_cert,
            };

            this.https_server = https.createServer(options, this.express_app);
            this.socketIO = socketIO(this.https_server, { 'transports': ['websocket'] });

            this.redirect_app = express();
            this.http_server = http.createServer(this.redirect_app);

            this.redirect_app.get('*', (req: Request, res: Response) => {
                res.redirect('https://' + req.headers.host + req.url);
            });
        } else {
            this.http_server = http.createServer(this.express_app);
            this.socketIO = socketIO(this.http_server, { 'transports': ['websocket'] });
        }
        this.attachWebRoutes();
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
    private attachWebRoutes() {
        this.express_app.get('/', (req: Request, res: Response) => {
            res.send(pug.renderFile(path.resolve('site/pug/index.pug')));
        });

        this.express_app.get('/dependencies/jquery.js', async (req: Request, res: Response) => {
            if (this.jqueryjs) {
                res.send(this.jqueryjs);
            } else {
                res.sendFile(path.resolve('dev_fallback/jquery.js'));
            }
        });
        this.express_app.get('/dependencies/vue(.js)?', async (req: Request, res: Response) => {
            if (this.vuejs) {
                res.type('this.express_application/javascript').send(this.vuejs);
            } else {
                res.sendFile(path.resolve('dev_fallback/vue.js'));
            }
        });

        this.express_app.get('/favicon.ico', (req: Request, res: Response) => {
            res.sendFile(path.resolve('site/logo/favicon.ico'));
        });

        this.express_app.get('/test', (req: Request, res: Response) => {
            res.send(pug.renderFile(path.resolve('site/pug/test.pug')));
        });
        this.express_app.get('/game', (req: Request, res: Response) => {
            res.send(pug.renderFile(path.resolve('site/pug/game.pug')));
        });
        this.express_app.get('/login', (req: Request, res: Response) => {
            res.send(pug.renderFile(path.resolve('site/pug/login.pug')));
        });
        this.express_app.get('/home', (req: Request, res: Response) => {
            res.send(pug.renderFile(path.resolve('site/pug/home.pug')));
        });
        this.express_app.get('/character_creation', (req: Request, res: Response) => {
            res.send(pug.renderFile(path.resolve('site/pug/character_creation.pug')));
        });
        this.express_app.get('/create', (req: Request, res: Response) => {
            res.send(pug.renderFile(path.resolve('site/pug/new.pug')));
        });

        this.express_app.use('/js', (req: Request, res: Response, next: NextFunction) => {
            res.sendFile(path.resolve('site/js' + req.path + (req.path.endsWith('.js') ? '' : '.js')));
        });
        this.express_app.use('/vue', (req: Request, res: Response, next: NextFunction) => {
            res.send(pug.renderFile(path.resolve('site/vue/' + req.path + '.pug')));
        });

        this.express_app.use('/svg/octicon/:name/:arg1?/:arg2?', (req: Request, res: Response, next: NextFunction) => {
            console.log(req.params);
            const icon = octicons[req.params.name];
            if (icon) {
                const attr: any = { 'xmlns': 'http://www.w3.org/2000/svg' }
                const params = [];
                if (req.params.arg1) {
                    params.push(req.params.arg1)
                }
                if (req.params.arg2) {
                    params.push(req.params.arg2);
                }
                for (const p of params) {
                    if (!(/^[0-9a0zA-Z-]^$/.test(p))) {
                        res.sendStatus(404);
                        return;
                    }
                    const seperator = '-';
                    const attributes = ['fill', 'stroke'];
                    const ps = p.split(seperator);
                    const id = ps[0];
                    let val = ps[1];
                    if (attributes.includes(id)) {
                        if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(val)) {
                            val = '#' + val;
                        }
                        attr[id] = val;
                    }
                }
                res.setHeader('Content-Type', 'image/svg+xml');
                res.send(icon.toSVG(attr));
            } else {
                res.sendStatus(404);
            }
        });

        this.express_app.use('/tex', express.static(path.resolve('site/tex')));
        this.express_app.use(express.static(path.resolve('public')));
    }

}
