declare module '@primer/octicons' {
    interface Octicon {
        path: string;
        toSVG(props?: { [attr: string]: string }): string;
    }
    let octicons: { [id: string]: Octicon | undefined };
    export = octicons;
}
