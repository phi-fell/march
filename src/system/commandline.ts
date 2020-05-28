import type { Server } from '../net/server';
import { launch_id, version } from '../version';

const DESCRIPTION_INDENT = 30;

export async function runCommand(command: string, server: Server, out: NodeJS.WriteStream, graceful_exit: () => void) {
    const tok = command.split(' ');
    const cmd = tok.shift();
    if (!cmd) {
        return;
    }
    if (commands[cmd]) {
        try {
            await commands[cmd].exec(out, tok, server, graceful_exit);
        } catch (err) {
            out.write('An exception occurred in the execution of the command:\n' + err + '\n');
        }
    } else {
        out.write('command not recognized: ' + cmd + ' try help or ?\n');
    }
}

function getHelp(out: NodeJS.WriteStream) {
    out.write('\nGotG V' + version + ' Launch_ID[' + launch_id + ']\n\nAvailable Commands:\n');
    Object.keys(commands).forEach((cmd) => {
        const signature = cmd + commands[cmd].arg_names.reduce((str, arg) => {
            return ' [' + arg + ']'
        }, '');
        out.write(' > ' + signature);
        out.write(' '.repeat(DESCRIPTION_INDENT - signature.length) + ': ' + commands[cmd].description + '\n');
    });
    out.write('\n');
}

class Command {
    constructor(
        public arg_names: string[],
        public description: string,
        public exec: (out: NodeJS.WriteStream, tok: string[], server: Server, graceful_exit: () => void) => void | Promise<void>,
    ) { }
}

const commands: { [cmd: string]: Command } = {
    '?': new Command(
        [],
        'display help dialog',
        (out, _tok) => {
            getHelp(out);
        },
    ),
    'help': new Command(
        [],
        'display help dialog',
        (out, _tok) => {
            getHelp(out);
        },
    ),
    'exit': new Command(
        [],
        'close the server gracefully',
        (out, _tok, _server, graceful_exit) => {
            graceful_exit();
        },
    ),
    'admin': new Command(
        ['username'],
        'makes a user an admin who can use admin chat commands and view /diagnostic pages',
        async (out, tok, server) => {
            if (tok.length !== 1) {
                out.write('Expected 1 argument!\n');
                return;
            }
            const user_id = await server.getUserIdFromName(tok[0])
            if (user_id === undefined) {
                out.write('No such user!\n');
                return;
            }
            const user = await server.getUser(user_id);
            if (user === undefined) {
                out.write('ERROR! Username maps to user ID, but no user exists with mapped ID!\n');
                return;
            }
            if (user.admin) {
                out.write(user.name + ' is aready an admin!\n');
            } else {
                user.admin = true;
                out.write(user.name + ' is now an admin!\n');
            }
        },
    ),
    'unadmin': new Command(
        ['username'],
        'makes a user no longer an admin',
        async (out, tok, server) => {
            if (tok.length !== 1) {
                out.write('Expected 1 argument!\n');
                return;
            }
            const user_id = await server.getUserIdFromName(tok[0])
            if (user_id === undefined) {
                out.write('No such user!\n');
                return;
            }
            const user = await server.getUser(user_id);
            if (user === undefined) {
                out.write('ERROR! Username maps to user ID, but no user exists with mapped ID!\n');
                return;
            }
            if (!user.admin) {
                out.write(user.name + ' is already not an admin!\n');
            } else {
                user.admin = false;
                out.write(user.name + ' is no longer an admin!\n');
            }
        },
    ),
};
