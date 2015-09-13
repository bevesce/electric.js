var pushIfNotIn = require('./utils//push-if-not-in');
var Graph = (function () {
    function Graph(source, depth, showCurrentValue) {
        this._sources = [];
        this.vertices = [];
        this.showCurrentValue = showCurrentValue;
        this.sourceIndex = this._findVertices(source, 0, depth);
        this._findEdges();
        this.clean();
    }
    Graph.of = function (source, depth, showCurrentValue) {
        if (showCurrentValue === void 0) { showCurrentValue = false; }
        return new Graph(source, depth, showCurrentValue);
    };
    Graph.prototype.removeVertex = function (id) {
        this.vertices = this.vertices
            .filter(function (v) { return v.id !== id; })
            .map(function (v) { return ({
            id: v.id,
            name: v.name,
            receivers: v.receivers.filter(function (r) { return r !== id; }),
            emitters: v.emitters.filter(function (e) { return e !== id; }),
            type: v.type
        }); });
        this.edges = this.edges.filter(function (e) { return e.source !== id && e.target !== id; });
    };
    Graph.prototype._findVertices = function (source, depth, maxDepth) {
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
        });
        source.__$visualize_visited_id$ = this.vertices.length - 1;
        this._goBackwards(source, depth + 1, maxDepth);
        this._goForwards(source, depth + 1, maxDepth);
        return source.__$visualize_visited_id$;
    };
    Graph.prototype._sourceType = function (source) {
        if (typeof source === 'function') {
            return 'receiver';
        }
        if (!source._wires) {
            return 'emitter';
        }
        return 'transformator';
    };
    Graph.prototype._goBackwards = function (source, depth, maxDepth) {
        var _this = this;
        if (this._shouldntGo(depth, maxDepth, source._wires)) {
            return;
        }
        source._wires.forEach(function (w) {
            var e = w.input;
            e = _this._maybeUnpackPlaceholder(e);
            var wId = _this._findVertices(e, depth, maxDepth);
            var sourceId = source.__$visualize_visited_id$;
            pushIfNotIn(_this.vertices[sourceId].emitters, wId);
            pushIfNotIn(_this.vertices[wId].receivers, sourceId);
        });
    };
    Graph.prototype._goForwards = function (source, depth, maxDepth) {
        var _this = this;
        if (this._shouldntGo(depth, maxDepth, source._receivers)) {
            return;
        }
        source._receivers.forEach(function (r) {
            r = _this._maybeUnpackWire(r);
            r = _this._maybeUnpackPlaceholder(r);
            var rId = _this._findVertices(r, depth, maxDepth);
            var sourceId = source.__$visualize_visited_id$;
            pushIfNotIn(_this.vertices[sourceId].receivers, rId);
            pushIfNotIn(_this.vertices[rId].emitters, sourceId);
        });
    };
    Graph.prototype._shouldntGo = function (depth, maxDepth, potentialEdges) {
        if (maxDepth && depth >= maxDepth) {
            return true;
        }
        if (potentialEdges === undefined) {
            return true;
        }
        return false;
    };
    Graph.prototype._maybeUnpackPlaceholder = function (e) {
        if (e._emitter !== undefined) {
            return e._emitter;
        }
        return e;
    };
    Graph.prototype._maybeUnpackWire = function (w) {
        if (w.input !== undefined && w.output !== undefined) {
            return w.output;
        }
        return w;
    };
    Graph.prototype._name = function (source) {
        if (typeof source === 'function') {
            return "< " + (source.name || 'anonymous') + " |";
        }
        return source.toString(this.showCurrentValue);
    };
    Graph.prototype._findEdges = function () {
        var _this = this;
        this.edges = [];
        for (var i = 0; i < this.vertices.length; i++) {
            var node = this.vertices[i];
            var type = 'transformator';
            node.emitters.forEach(function (e) {
                _this.edges.push({
                    source: e,
                    target: i
                });
            });
        }
    };
    Graph.prototype.clean = function () {
        this._sources.forEach(function (s) { return s.__$visualize_visited_id$ = undefined; });
    };
    Graph.prototype.stringify = function () {
        return JSON.stringify({
            vertices: this.vertices,
            edges: this.edges
        });
    };
    return Graph;
})();
module.exports = Graph;
