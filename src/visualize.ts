function rn(name: string) {
	return `<| ${name} |`;
}

export module inspector {
	export function getReceivers(emitter: any) {
		if (emitter._receivers === undefined) {
			return null;
		}
		return emitter._receivers.map(
			(r: any) => inspector.describeReceiver(r, emitter)
		);
	}

	export function describeReceiver(receiver: any, ofEmitter: any) {
		// function
		if (typeof receiver === 'function') {
			return {
				name: rn(receiver.name),
				value: receiver
			}
		}
		// wire to something
		else if (receiver.input = ofEmitter && receiver.output !== undefined) {
			return {
				name: receiver.output.toString(),
				value: receiver.output
			}
		}
		// wire without in/out
		return {
			name: receiver.toString(),
			value: receiver
		}
	}

	export function getEmitters(transformator: any) {
		if (transformator._wires === undefined) {
			return null;
		}
		return transformator._wires.map((w: any) => ({
			name: w.input.toString(),
			value: w.input
		}));
	}
}

interface Kmap {
	[key: number]: any;
}

export class Graph {
	id: number;
	nodesById: Kmap;
	lastSourceId: number;
	nodes: any[];
	links: any[];
	private _sources: any[];

	static of(source: any) {
		return new Graph(source);
	}

	constructor(source: any) {
		this.nodesById = {};
		this.id = 0;
		this._sources = [];
		var lastSourceId = this.insert(source);
		this.makeNodesList();
		this.clean();
	}

	makeNodesList() {
		this.nodes = [];
		this.links = [];
		for (var i = 0; i < this.id; i++) {
			var node = this.nodesById[i];
			this.nodes.push(node);
			var type = 'transformator';
			if (node.emitters.length == 0) {
				type = 'emitter';
			}
			node.receivers.forEach((e, j) => {
				var rec = this.nodesById[e];
				if (rec.emitters.length === 0) {
					type = 'receiver';
				}
				this.links.push({
					source: i,
					target: e,
					type: type
				})
			});
			node.emitters.forEach((e, j) => {
				this.links.push({
					source: e,
					target: i,
					type: 'transformator'
				})
			});
		}
	}

	insert(source: any) {
		if (source.__$visualize_visited_id$ !== undefined) {
			return source.__$visualize_visited_id$;
		}
		this._sources.push(source);
		var sourceId = this.id++;
		source.__$visualize_visited_id$ = sourceId;
		this.nodesById[sourceId] = {
			id: sourceId,
			name: this.name(source),
			receivers: [],
			emitters: []
		}
		this.goBackwards(source);
		this.goForwards(source);
		return sourceId;
	}

	private goBackwards(source: any) {
		if (source._wires === undefined) {
			return;
		}
		source._wires.forEach((w: any) => {
			var e = w.input;
			if (e._emitter !== undefined) {
				e = e._emitter;
			}
			var wId = this.insert(e);
			this.nodesById[source.__$visualize_visited_id$].emitters.push(wId)
		})
	}

	private goForwards(source: any) {
		if (source._receivers === undefined) {
			return;
		}
		source._receivers.forEach((r: any) => {
			if (r.input !== undefined && r.output !== undefined) {
				r = r.output;
			}
			if (r._emitter !== undefined) {
				r = r._emitter;
			}
			var rId = this.insert(r);
			this.nodesById[source.__$visualize_visited_id$].receivers.push(rId)
		});
	}

	private name(source: any) {
		if (typeof source === 'function') {
			return `<| ${source.name}() |`;
		}
		return source.toString();
	}

	private clean() {
		this._sources.forEach((s: any) => s.__$visualize_visited_id$ = undefined);
	}
}
