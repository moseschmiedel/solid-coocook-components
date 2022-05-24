/* StackOverflow: https://stackoverflow.com/a/32108184 */
export const isEmpty: (o: Object | null | undefined) => boolean =
o => {
    console.log('object');
    console.log(o);

    if (o) {
        console.log('keys');
        console.log(Object.keys(o));
        console.log('prototype');
        console.log(Object.getPrototypeOf(o));
    }
    return o != null
        && Object.keys(o).length === 0
        && Object.getPrototypeOf(o) === Object.prototype;
}