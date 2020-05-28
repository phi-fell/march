import bent from 'bent';
import cookieParser from 'cookie-parser';
import express, { NextFunction, Request, Response } from 'express';
import pug from 'pug';
import * as stylus from 'stylus';
import { File } from '../system/file';
import { buildAllOcticons } from '../util/octicons';
import { launch_id, version } from '../version';
import http = require('http');
import https = require('https');
import path = require('path');
import octicons = require('@primer/octicons');
import socketIO = require('socket.io');


const LINKS: { [id: string]: string } = {
    'github': 'https://github.com/phi-fell/march',
    'bugs': 'https://github.com/phi-fell/march/issues',
};

export class WebServerOptions {
    public http_port: number = 80;
    public https_port: number = 443;
    public use_https: boolean = true;
    public unlock_diagnostic: boolean = false;
    public useDebugJS: boolean = false;
    public static_site: boolean = false;
    public https_key: string = '';
    public https_cert: string = '';
    public clone(): WebServerOptions {
        const ret = new WebServerOptions();
        ret.http_port = this.http_port;
        ret.https_port = this.https_port;
        ret.use_https = this.use_https;
        ret.unlock_diagnostic = this.unlock_diagnostic;
        ret.useDebugJS = this.useDebugJS;
        ret.static_site = this.static_site
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
            try {
                await buildAllOcticons('site/octicon');
            } catch (error) {
                console.log('could not build octicon');
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
        this.express_app.get('/favicon.ico', (req: Request, res: Response) => {
            res.sendFile(path.resolve('site/logo/favicon.ico'));
        });

        const html_pages = ['test', 'game', 'login', 'home', 'character_creation', 'create', 'diagnostic'] as const;
        if (this.options.static_site) {
            this.express_app.get('/', (req: Request, res: Response) => {
                res.sendFile(path.resolve('site/html/index.html'));
            });
            for (const page of html_pages) {
                this.express_app.get(`/${page}(.html)?`, (req: Request, res: Response) => {
                    res.sendFile(path.resolve(`site/html/${page}.html`));
                });
            }
            this.express_app.use('/vue', (req: Request, res: Response) => {
                res.sendFile(path.resolve(`site/html/vue${req.path}${req.path.endsWith('.html') ? '' : '.html'}`));
            });
            this.express_app.use('/css', (req: Request, res: Response) => {
                res.sendFile(path.resolve(`site/css${req.path}${req.path.endsWith('.css') ? '' : '.css'}`));
            });
        } else {
            const pug_locals = {
                'jquery_path': './dependencies/jquery.js',
                'vue_path': './dependencies/vue.js',
                'socket_io_path': './socket.io/socket.io.js',
                'github_link': LINKS.github,
                'bug_link': LINKS.bugs,
            };
            this.express_app.get('/', (req: Request, res: Response) => {
                res.send(pug.renderFile(path.resolve('site/pug/index.pug'), pug_locals));
            });
            this.express_app.get('/dependencies/jquery(.js)?', async (req: Request, res: Response) => {
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
            for (const page of html_pages) {
                this.express_app.get(`/${page}(.html)?`, (req: Request, res: Response) => {
                    res.send(pug.renderFile(path.resolve(`site/pug/${page}.pug`), pug_locals));
                });
            }
            this.express_app.use('/vue', (req: Request, res: Response) => {
                const filename = req.path.replace('.html', '');
                res.send(pug.renderFile(path.resolve(`site/pug/vue${filename}.pug`)));
            });

            this.express_app.use('/css', async (req: Request, res: Response) => {
                const filename = req.path.replace('.css', '');
                try {
                    stylus.render(
                        (await File.getReadOnlyFile(`site/stylus/${filename}.styl`)).getString(),
                        {
                            'filename': req.path,
                            'paths': ['site/stylus'],
                        },
                        (err, css) => {
                            if (err) {
                                console.log(err);
                                res.send(err);
                            } else {
                                res.setHeader('Content-Type', 'text/css');
                                res.send(css);
                            }
                        },
                    );
                } catch (e) {
                    console.log(e);
                    res.sendStatus(404)
                }
            });
        }

        this.express_app.use('/js', (req: Request, res: Response) => {
            res.sendFile(path.resolve(`site/js${req.path}${req.path.endsWith('.js') ? '' : '.js'}`));
        });

        this.express_app.use('/svg/octicon', (req: Request, res: Response) => {
            res.sendFile(path.resolve(`site/octicon${req.path}${req.path.endsWith('.svg') ? '' : '.svg'}`));
        });

        this.express_app.use('/link/:link', (req: Request, res: Response, next: NextFunction) => {
            const link = req.params.link;
            if (LINKS[link]) {
                res.redirect(LINKS[link]);
            } else {
                res.sendStatus(404);
            }
        });

        this.express_app.use('/tex', express.static(path.resolve('site/tex')));
        this.express_app.use(express.static(path.resolve('public')));
    }

}
