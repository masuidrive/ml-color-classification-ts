export const times = <T>(n: number, callbackfn: (index: number) => T) =>
    [...Array(n)].map((_: any, index: number) => callbackfn(index));

export const clone = <T>(data: T) => JSON.parse(JSON.stringify(data)) as T;
