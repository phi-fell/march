export type ValueOf<T> = T[keyof T];
export type ValueOfArray<T extends { [index: number]: any }> = T[number];
