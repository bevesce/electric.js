function rn(name) {
    return "<| " + name + " |";
}
var Graph = (function () {
    function Graph(source) {
        this.nodesById = {};
        this.id = 0;
        this._sources = [];
        var lastSourceId = this.makeNodesIdMap(source);
        this.makeNodesList();
        this.clean();
    }
    Graph.of = function (source) {
        return new Graph(source);
    };
    Graph.prototype.makeNodesList = function () {
        var _this = this;
        this.nodes = [];
        this.links = [];
        for (var i = 0; i < this.id; i++) {
            var node = this.nodesById[i];
            this.nodes.push(node);
            var type = 'transformator';
            if (node.emitters.length == 0) {
                type = 'emitter';
            }
            node.receivers.forEach(function (e, j) {
                var rec = _this.nodesById[e];
                if (rec.emitters.length === 0) {
                    type = 'receiver';
                }
                _this.links.push({
                    source: i,
                    target: e,
                    type: type
                });
            });
            node.emitters.forEach(function (e, j) {
                _this.links.push({
                    source: e,
                    target: i,
                    type: 'transformator'
                });
            });
        }
    };
    Graph.prototype.makeNodesIdMap = function (source) {
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
        };
        this.goBackwards(source);
        this.goForwards(source);
        return sourceId;
    };
    Graph.prototype.goBackwards = function (source) {
        var _this = this;
        if (source._wires === undefined) {
            return;
        }
        source._wires.forEach(function (w) {
            var e = w.input;
            e = _this._maybeUnpackPlaceholder(e);
            var wId = _this.insert(e);
            _this.nodesById[source.__$visualize_visited_id$].emitters.push(wId);
        });
    };
    Graph.prototype.goForwards = function (source) {
        var _this = this;
        if (source._receivers === undefined) {
            return;
        }
        source._receivers.forEach(function (r) {
            if (r.input !== undefined && r.output !== undefined) {
                r = r.output;
            }
            r = _this._maybeUnpackPlaceholder(r);
            var rId = _this.insert(r);
            _this.nodesById[source.__$visualize_visited_id$].receivers.push(rId);
        });
    };
    Graph.prototype._maybeUnpackPlaceholder = function (e) {
        if (e._emitter !== undefined) {
            return e._emitter;
        }
        return e;
    };
    Graph.prototype.name = function (source) {
        if (typeof source === 'function') {
            return "<| " + source.name + "() |";
        }
        return source.toString();
    };
    Graph.prototype.clean = function () {
        this._sources.forEach(function (s) { return s.__$visualize_visited_id$ = undefined; });
    };
    return Graph;
})();
module.exports = Graph;
