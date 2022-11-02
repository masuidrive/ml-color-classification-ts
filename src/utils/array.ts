export const times = (n: number, callbackfn: (index: number) => number[] | number | void) =>
    [...Array(n)].map((_: any, index: number) => callbackfn(index));
export const clone = (data: any) => JSON.parse(JSON.stringify(data));
