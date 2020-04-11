declare module '@primer/octicons' {
    interface Octicon {
        toSVG(): string;
    }
    var octicons: { [id: string]: Octicon | undefined };
    export = octicons;
}
