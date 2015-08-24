interface FunctionT<T> {
	(...args: any[]): T;
}

export function callIfFunction<Out>(
	obj: Out | FunctionT<Out>, ...args: any[]
): Out {
	if (typeof obj === 'function') {
		return (<FunctionT<Out>>obj).apply(null, args);
	}
	else {
		return <Out>obj;
	}
}


export function any(list: any[]): any {
	for (var i = 0; i < list.length; i++) {
		if (list[i]) {
			return true;
		}
	}
	return false;
}

export function all(list: any[]) {
	for (var i = 0; i < list.length; i++) {
		if (!list[i]) {
			return false;
		}
	}
	return true;
}