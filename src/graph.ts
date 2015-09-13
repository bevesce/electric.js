import pushIfNotIn = require('./utils//push-if-not-in');

export = Graph;

interface Vertex {
	id: number,
	name: string,
	receivers: number[],
	emitters: number[],
	type: string
}

interface Edge {
	source: number,
	target: number
}

class Graph {
	id: number;
	sourceIndex: number;
	vertices: Vertex[];
	edges: Edge[];
	private _sources: any[];

	static of(source: any, depth?: number) {
		return new Graph(source, depth);
	}

	constructor(source: any, depth: number) {
		this._sources = [];
		this.vertices = [];
		this.sourceIndex = this._findVertices(source, 0, depth);
		this._findEdges();
		this.clean();
	}

	private _findVertices(source: any, depth: number, maxDepth: number) {
		if (source.__$visualize_visited_id$ !== undefined) {
			return source.__$visualize_visited_id$;
		}
		this._sources.push(source);
		this.vertices.push({
			id: this.vertices.length,
			name: this._name(source),
			receivers: [],
			emitters: [],
			type: this._sourceType(source)
		})
		source.__$visualize_visited_id$ = this.vertices.length - 1;
		this._goBackwards(source, depth + 1, maxDepth);
		this._goForwards(source, depth + 1, maxDepth);
		return source.__$visualize_visited_id$;
	}

	private _sourceType(source: any) {
		if (typeof source === 'function') {
			return 'receiver';
		}
		if (!source._wires) {
			return 'emitter';
		}
		return 'transformator';
	}

	private _goBackwards(source: any, depth: number, maxDepth: number) {
		if (this._shouldntGo(depth, maxDepth, source._wires)) {
			return;
		}
		source._wires.forEach((w: any) => {
			var e = w.input;
			e = this._maybeUnpackPlaceholder(e);
			var wId = this._findVertices(e, depth, maxDepth);
			var sourceId = source.__$visualize_visited_id$;
			pushIfNotIn(this.vertices[sourceId].emitters, wId);
			pushIfNotIn(this.vertices[wId].receivers, sourceId);
		})
	}

	private _goForwards(source: any, depth: number, maxDepth: number) {
		if (this._shouldntGo(depth, maxDepth, source._receivers)) {
			return;
		}
		source._receivers.forEach((r: any) => {
			r = this._maybeUnpackWire(r);
			r = this._maybeUnpackPlaceholder(r);
			var rId = this._findVertices(r, depth, maxDepth);
			var sourceId = source.__$visualize_visited_id$;
			pushIfNotIn(this.vertices[sourceId].receivers, rId);
			pushIfNotIn(this.vertices[rId].emitters, sourceId);
		});
	}

	private _shouldntGo(depth: number, maxDepth: number, potentialEdges: any) {
		if (maxDepth && depth >= maxDepth) {
			return true;
		}
		if (potentialEdges === undefined) {
			return true;
		}
		return false;
	}

	private _maybeUnpackPlaceholder(e: any) {
		if (e._emitter !== undefined) {
			return e._emitter;
		}
		return e;
	}

	private _maybeUnpackWire(w: any) {
		if (w.input !== undefined && w.output !== undefined) {
			return w.output;
		}
		return w;
	}

	private _name(source: any) {
		if (typeof source === 'function') {
			return `< ${source.name || 'anonymous'} |`;
		}
		return source.toString();
	}

	private _findEdges() {
		this.edges = [];
		for (var i = 0; i < this.vertices.length; i++) {
			var node = this.vertices[i];
			var type = 'transformator';
			node.emitters.forEach((e: number) => {
				this.edges.push({
					source: e,
					target: i
				})
			});
		}
	}

	private clean() {
		this._sources.forEach((s: any) => s.__$visualize_visited_id$ = undefined);
	}

	stringify() {
		return JSON.stringify({
			vertices: this.vertices,
			edges: this.edges
		});
	}
}
