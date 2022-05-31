/* StackOverflow: https://stackoverflow.com/a/32108184 */
export const isEmpty: (o: Object | null | undefined) => boolean =
o => {
    return o != null
        && Object.keys(o).length === 0
        && Object.getPrototypeOf(o) === Object.prototype;
}