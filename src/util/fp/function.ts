export function pipe<A>(
    arg: A): A
export function pipe<A, B>(
    arg: A,
    f1: (a: A) => B): B
export function pipe<A, B, C>(
    arg: A,
    f1: (a: A) => B,
    f2: (b: B) => C): C
export function pipe<A, B, C, D>(
    arg: A,
    f1: (a: A) => B,
    f2: (b: B) => C,
    f3: (c: C) => D): D
export function pipe<A, B, C, D, E>(
    arg: A,
    f1: (a: A) => B,
    f2: (b: B) => C,
    f3: (c: C) => D,
    f4: (d: D) => E): E
export function pipe<A, B, C, D, E, F>(
    arg: A,
    f1: (a: A) => B,
    f2: (b: B) => C,
    f3: (c: C) => D,
    f4: (d: D) => E,
    f5: (e: E) => F): F
export function pipe<A, B, C, D, E, F>(
    arg: A,
    f1?: Function,
    f2?: Function,
    f3?: Function,
    f4?: Function,
    f5?: Function
): unknown {
    switch (arguments.length) {
        case 1:
            return arg;
        case 2:
            return f1!(arg);
        case 3:
            return f2!(f1!((arg)));
        case 4:
            return f3!(f2!(f1!((arg))));
        case 5:
            return f4!(f3!(f2!(f1!((arg)))));
        case 6:
            return f5!(f4!(f3!(f2!(f1!((arg))))));
    }
}