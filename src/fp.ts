interface AnyFunction {
	(...args: any[]): any;
};

export function curry<T>(
	f: AnyFunction, arity = 2
): AnyFunction {
	function partial(prevArgs: any[]): AnyFunction {
		return function(...args: any[]): (AnyFunction | T) {
			var nextArgs: any[] = prevArgs.slice();
			nextArgs.splice(nextArgs.length, 0, ...args);
			if (nextArgs.length >= arity) {
				return f(...nextArgs);
			}
			return partial(nextArgs)
		}
	}
	return partial([]);
};

export function property(name: string){
	return function(obj: any){
		return obj[name];
	}
};


export function compose(f: AnyFunction, g: AnyFunction) {
	return function(...args: any[]){
		return f(g(...args));
	}
}


interface Functor<In> {
	// static a(value: In): Functor<In>;
	map<Out>(f: (value: In) => Out): Functor<Out>;
}

interface Monad<In> extends Functor<In> {
	flatten(): In | Monad<In>;
	chain<Out>(f: (value: In) => Monad<Out>): Out | Monad<Out>
}


export module maybe {
	interface Maybe<T> extends Monad<T> {

	}

	class Just<T> implements Maybe<T>{
		private value: T;

		constructor(value: T) {
			this.value = value;
		}

		map<Out>(f: (value: T) => Out): Maybe<Out> {
			var result = f(this.flatten());
			return just(result);
		}

		flatten() {
			return this.value;
		}

		chain<Out>(f: (value: T) => Maybe<Out>) {
			return this.map(f).flatten();
		}
	}

	export function just<T>(value: T): Maybe<T> {
		return new Just(value);
	}

	class Nothing<T> implements Maybe<T> {
		map(f: any) {
			return nothing;
		}

		bind(f: any) {
			return nothing;
		}

		flatten() {
			return nothing;
		}

		chain<Out>(f: (value: T) => Maybe<Out>) {
			return nothing;
		}
	}

	export var nothing = new Nothing();
}


export module either {
	interface Either<L, R> extends Monad<R> {
		isRight(): boolean;
		isLeft(): boolean;
	}

	class Right<L, R> implements Either<L, R>{
		private value: R;

		constructor(value: R) {
			this.value = value;
		}

		map<Out>(f: (value: R) => Out): Either<L, Out> {
			var result = f(<R>this.flatten());
			return right(result);
		}

		flatten(): R | Either<L, R> {
			return this.value;
		}

		chain<Out>(f: (value: R) => Either<L, Out>) {
			return this.map(f).flatten();
		}

		isRight() {
			return true;
		}

		isLeft() {
			return false;
		}
	}

	export function right<L, R>(value: R): Either<L, R> {
		return new Right(value);
	}

	class Left<L, R> implements Either<L, R> {
		private value: L;

		constructor(value: L) {
			this.value = value;
		}

		map<Out>(f: (value: R) => Out): Either<L, Out> {
			return <Either<L, Out>>left(this.value);
		}

		flatten(): R | Either<L, R> {
			return <Either<L, R>>left(this.value);
		}

		chain<Out>(f: (value: R) => Either<L, Out>) {
			return left(this.value);
		}

		isRight() {
			return false;
		}

		isLeft() {
			return true;
		}
	}

	export function left<L, R>(value: L): Either<L, R> {
		return <any>(new Left(value));
		// when remove <any> casting:
		// Neither type 'Left<L, {}>' nor type 'Either<L, R>' is assignable to the other.
		// Types of property 'flatten' are incompatible.
		// Type '() => {} | Either<L, {}>' is not assignable to type '() => R | Monad<R>'.
		// Type '{} | Either<L, {}>' is not assignable to type 'R | Monad<R>'.
        // Type '{}' is not assignable to type 'R | Monad<R>'.
		// Type '{}' is not assignable to type 'Monad<R>'.
		// Property 'flatten' is missing in type '{}'.
	}
}
