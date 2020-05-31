import type { User } from '../net/user';
import type { Player } from '../world/player';

const DESCRIPTION_INDENT = 10;

export const ChatCommands = {
    async 'exec'(command_string: string, user: User, player: Player): Promise<string> {
        try {
            const tok = command_string.split(' ');
            const cmd = tok.shift();
            if (!cmd) {
                return 'No command entered';
            }
            const command = commands[cmd];
            if (command !== undefined) {
                if (tok.length < command.min_args) {
                    return 'Too few arguments, please supply at least ' + command.min_args;
                }
                if (tok.length > command.max_args) {
                    return 'Too many arguments, please supply at most ' + command.max_args;
                }
                return await commands[cmd].exec(tok, user, player);
            }
            return 'Command not recognized: ' + cmd + ' try /help or /?';
        } catch (err) {
            console.log(err);
            return 'Command failed with an exception. This is likely a bug.';
        }
    }
}

function getHelp(): string {
    let ret: string = 'Available Commands:\n';
    Object.keys(commands).forEach((cmd) => {
        const signature = cmd + commands[cmd].arg_names.reduce((str, arg) => {
            return str + ' [' + arg + ']'
        }, '');
        ret += ' /' + signature;
        ret += ' '.repeat(DESCRIPTION_INDENT - signature.length) + ': ' + commands[cmd].description + '\n';
    });
    return ret;
}

class Command {
    constructor(
        public arg_names: string[],
        public description: string,
        public min_args: number,
        public max_args: number,
        public exec: (tok: string[], user: User, player: Player) => string | Promise<string>,
    ) { }
}

const commands: { [cmd: string]: Command } = {
    '?': new Command(
        [],
        'display help dialog',
        0, 0,
        (_tok) => {
            return getHelp();
        },
    ),
    'help': new Command(
        [],
        'display help dialog',
        0, 0,
        (_tok) => {
            return getHelp();
        },
    ),
    'add_control_set': new Command(
        [],
        'display help dialog',
        1, 1,
        (tok, user, player) => {
            return user.settings.createControlSet(tok[0]);
        },
    ),
};
