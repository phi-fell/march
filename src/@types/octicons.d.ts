declare module '@primer/octicons' {
    interface Octicon {
        toSVG(): string;
    }
    let octicons: { [id: string]: Octicon | undefined };
    export = octicons;
}
