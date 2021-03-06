export = callIfFunction;

interface FunctionT<T> {
	(...args: any[]): T;
}

function callIfFunction<Out>(
	obj: Out | FunctionT<Out>, ...args: any[]
): Out {
	if (typeof obj === 'function') {
		return (<FunctionT<Out>>obj).apply(null, args);
	}
	else {
		return <Out>obj;
	}
}
