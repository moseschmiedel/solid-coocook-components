enum OptionType {
    Some = 'SOME',
    None = 'NONE',
}

interface Some<T> {
    readonly _type: OptionType.Some;
    readonly _value: T;
    unwrap(): T;
}

interface None {
    readonly _type: OptionType.None;
    unwrap(): null;
}

type Option<T> = Some<T> | None;

function some<T>(value: T | Option<T>): Option<T> {
    if (isNone(value)) return none();
    if (isSome(value)) return some(value._value);

    return {
        _type: OptionType.Some,
        _value: value,
        unwrap() { return this._value },
    };
}

function none(): None {
    return {
        _type: OptionType.None,
        unwrap() { return null },
    };
}

const or: <A>(op: Option<A>, fallback: A) => A = (op, fallback) => {
    if (isSome(op)) return op._value;
    else return fallback;
}

const map: <A, B>(opA: Option<A>) => (f: (a: A) => B) => Option<B> = opA => f => {
    switch (opA._type) {
        case OptionType.None:
            return none();
        case OptionType.Some:
            return some(f(opA._value));
    }
}

const map2: <A, B, R>(opA: Option<A>) => (opB: Option<B>) => (f: (a: A, b: B) => R) => Option<R> = opA => opB => f => {
    if (opA._type === OptionType.Some && opB._type === OptionType.Some)
        return some(f(opA._value, opB._value));

    return none();

}

const chain: <A, B>(opA: Option<A>) => (f: (a: A) => Option<B>) => Option<B> = opA => f => {
    switch (opA._type) {
        case OptionType.None:
            return none();
        case OptionType.Some:
            return some(f(opA._value));
    }
}

function isSome<T>(o: any): o is Some<T> {
    if (typeof o !== 'object') return false;
    return o._type === OptionType.Some;
}

function isNone(o: any): o is None {
    if (o === null || o === undefined) return true;
    if (typeof o !== 'object') return false;
    return o._type === OptionType.None;
}

function defaultFallback<T>(option: Option<T>, fallback: T): T {
    if (isSome(option)) return option._value;
    return fallback;
}

export {
    some,
    none,
    map,
    map2,
    chain,
    isSome,
    isNone,
    or,
    defaultFallback
};
export type { Option };

