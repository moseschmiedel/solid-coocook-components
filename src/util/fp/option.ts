enum OptionType {
    Some = 'SOME',
    None = 'NONE',
}

interface Some<T> {
    readonly _type: OptionType.Some;
    readonly _value: T;
}

interface None {
    readonly _type: OptionType.None;
}

type Option<T> = Some<T> | None;

function some<T>(value: T | Some<T>): Option<T> {
    if (isNone(value)) return none();
    if (isSome(value)) return some(value._value);

    return {
        _type: OptionType.Some,
        _value: value,
    };
}

function none(): None {
    return {
        _type: OptionType.None,
    };
}

const map: <A, B>(opA: Option<A>) => (f: (a: A) => B) => Option<B> = opA => f => {
    switch (opA._type) {
        case OptionType.None:
            return none();
        case OptionType.Some:
            return some(f(opA._value));
    }
}

const chain: <A, B>(opA: Option<A>) => (f: (a: A) => Option<B>) => Option<B> = opA => f => {
    switch (opA._type) {
        case OptionType.None:
            return none();
        case OptionType.Some:
            return f(opA._value);
    }
}

function isSome<T>(o: any): o is Some<T> {
    return o._type === OptionType.Some;
}

function isNone(o: any): o is None {
    return o._type === OptionType.None;
}

function unwrap<T>(option: Option<T>): T | null {
    if (isSome(option)) return option._value;
    return null;
}

export {
    some,
    none,
    map,
    chain,
    isSome,
    isNone,
    unwrap,
};
export type { Option };

