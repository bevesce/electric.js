export = mapObj;

function mapObj<In, Out>(
	obj: { [key: string]: In }, mapping: (v: In) => Out
): { [key: string]: Out } {
	var result: { [key: string]: Out } = {};
    for (var key in obj) {
    	if (!obj.hasOwnProperty(key)) {
    		continue;
    	}
    	result[key] = mapping(obj[key]);
    }
    return result;
}