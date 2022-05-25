export function c(...classes: Array<string>): string {
    console.log('classes');
    console.log(classes);
    return classes.join(' ');
}