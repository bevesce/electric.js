export = objKeys;

function objKeys(obj: any): string[] {
	var result: string[] = [];
	for (var k in obj) {
		if (obj.hasOwnProperty(k)) {
			result.push(k)
		}
	}
	return result;
}
