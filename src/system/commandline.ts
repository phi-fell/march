import { launch_id, version } from '../version';

export function runCommand(command: string, out: NodeJS.WriteStream, graceful_exit: () => void) {
    const tok = command.split(' ');
    const cmd = tok.shift();
    if (!cmd) {
        return;
    }
    if (commands[cmd]) {
        commands[cmd].exec(out, tok, graceful_exit);
    } else {
        out.write('command not recognized: /' + cmd + ' try /help or /?\n');
    }
}

function getHelp(out: NodeJS.WriteStream) {
    out.write('GotG V' + version + ' Launch_ID[' + launch_id + ']\n\n');
    Object.keys(commands).forEach((cmd) => {
        out.write('/' + cmd + ': ' + commands[cmd].description + '\n');
    });
}

class Command {
    constructor(public description: string, public exec: (out: NodeJS.WriteStream, tok: string[], graceful_exit: () => void) => void) { }
}

const commands: { [cmd: string]: Command } = {
    '?': new Command('display help dialog',
        (out, _tok) => {
            getHelp(out);
        }
    ),
    'help': new Command('display help dialog',
        (out, _tok) => {
            getHelp(out);
        }
    ),
    'exit': new Command('display help dialog',
        (out, _tok, graceful_exit) => {
            graceful_exit();
        }
    ),
};
