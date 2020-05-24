export type ValueOf<T> = T[keyof T];
export type ValueOfArray<T extends { [index: number]: any }> = T[number];
export type Constructed<T extends new (...args: any) => any> = T extends new (...args: any) => infer U ? U : never;
