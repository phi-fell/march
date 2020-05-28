import type { Player } from '../world/player';

const DESCRIPTION_INDENT = 10;

export const ChatCommands = {
    async 'exec'(command: string, player: Player): Promise<string> {
        try {
            const tok = command.split(' ');
            const cmd = tok.shift();
            if (!cmd) {
                return 'No command entered';
            }
            if (commands[cmd]) {
                return await commands[cmd].exec(tok);
            }
            return 'Command not recognized: ' + cmd + ' try help or ?';
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
        public exec: (tok: string[]) => string | Promise<string>,
    ) { }
}

const commands: { [cmd: string]: Command } = {
    '?': new Command(
        [],
        'display help dialog',
        (_tok) => {
            return getHelp();
        },
    ),
    'help': new Command(
        [],
        'display help dialog',
        (_tok) => {
            return getHelp();
        },
    ),
};
