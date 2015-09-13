export = shallowCopy;

function shallowCopy(obj: any) {
	var copy: any = {};
	for (var k in obj) {
		copy[k] = obj[k];
	}
	return copy;
}
