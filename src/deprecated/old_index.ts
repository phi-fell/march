import cookieParser = require('cookie-parser');
import express = require('express');
import { readFileSync, writeFileSync } from 'fs';
import pug from 'pug';
import { Version, versions, version_hash } from '../version';
import path = require('path');

let USE_HTTPS = true;
let PUBLISH_DIAGNOSTIC_DATA = false;
let UNLOCK_DIAGNOSTIC = false;

process.argv.forEach((val, index, array) => {
    if (val === '-NO_HTTPS') {
        USE_HTTPS = false;
    } else if (val === '-PUBLISH_DIAGNOSTIC_DATA') {
        PUBLISH_DIAGNOSTIC_DATA = true;
    } else if (val === '-UNLOCK_DIAGNOSTIC') {
        UNLOCK_DIAGNOSTIC = true;
    }
});

const app = express();
app.use(cookieParser());
app.use(express.json());

let admin_token: string = '';
if (!UNLOCK_DIAGNOSTIC) {
    admin_token = String(readFileSync('admin/token'));
}

function validateAdminToken(token: string) {
    if (UNLOCK_DIAGNOSTIC) {
        return true;
    }
    return token && token === admin_token; // TODO: admin credentials
}


if (PUBLISH_DIAGNOSTIC_DATA) {
    app.get('/diagnostic/version', (req: any, res: any, next: any) => {
        if (validateAdminToken(req.cookies.admin_token)) {
            res.send(
                pug.renderFile(
                    path.resolve(
                        __dirname + '/../site/pug/diagnostic/version.pug',
                    ),
                    {
                        'versions': versions,
                        'current': version_hash,
                    },
                ),
            );
        } else {
            next();
        }
    });

    app.post('/diagnostic/version/refresh', (req: any, res: any, next: any) => {
        if (validateAdminToken(req.cookies.admin_token)) {
            Version.refresh();
            res.send({
                'status': 'success',
            });
        } else {
            next();
        }
    });

    app.post('/diagnostic/version', (req: any, res: any, next: any) => {
        if (validateAdminToken(req.cookies.admin_token)) {
            writeFileSync(
                'config/launch.json',
                JSON.stringify({
                    'hash': req.body.hash,
                    'rebuild': true,
                }),
            );
            res.send({
                'status': 'success',
            });
            process.exit();
        } else {
            next();
        }
    });
}
