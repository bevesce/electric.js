import inf = require('./interfaces');

export import scheduler = require('./scheduler');
export import device = require('./device');
export import emitter = require('./emitter');
export import transformator = require('./transformator');
export import receiver = require('./receiver');
export import clock = require('./clock');
export import fp = require('./fp');


export function lift<In, Out>(f: (...values: In[]) => Out) {
	return function(...emitters: inf.IEmitter<In>[]) {
		return transformator.map(f, ...emitters);
	}
}
