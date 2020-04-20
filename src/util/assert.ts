export function assertUnreachable(arg: never): never {
    throw new Error('Unreachable code reached!');
}
