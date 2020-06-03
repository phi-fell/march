import type { User } from '../net/user';
import type { Player } from '../world/player';

const DESCRIPTION_INDENT = 5;

export const ChatCommands = {
    async 'exec'(command_string: string, user: User, player: Player): Promise<string | undefined> {
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
    let ret: string = 'Available Commands:\n\n';
    Object.keys(commands).forEach((cmd) => {
        const args = commands[cmd].arg_names;
        ret += ' /' + cmd + ((args.length > 0) ? (' [' + args.join('] [') + ']\n\n') : '\n\n');
        ret += ' '.repeat(DESCRIPTION_INDENT) + commands[cmd].description + '\n\n';
    });
    return ret;
}

class Command {
    constructor(
        public arg_names: string[],
        public description: string,
        public min_args: number,
        public max_args: number,
        public exec: (tok: string[], user: User, player: Player) => string | undefined | Promise<string | undefined>,
    ) { }
}

const commands: { [cmd: string]: Command } = {
    '?': new Command(
        [],
        'Display help dialog',
        0, 0,
        (_tok) => {
            return getHelp();
        },
    ),
    'help': new Command(
        [],
        'Display help dialog',
        0, 0,
        (_tok) => {
            return getHelp();
        },
    ),
    'add_control_set': new Command(
        ['name'],
        'Create a new control set',
        1, 1,
        (tok, user, player) => {
            const msg = user.settings.createControlSet(tok[0]);
            user.sendSettings();
            return msg;
        },
    ),
    'setting': new Command(
        ['section', 'setting', 'value'],
        'Change a setting\'s value',
        3, 3,
        (tok, user, _player) => {
            const msg = user.settings.setSetting(tok[0], tok[1], tok[2]);
            user.sendSettings();
            return msg;
        }
    ),
};
