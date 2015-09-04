function rn(name) {
    return "<| " + name + " |";
}
var inspector;
(function (inspector) {
    function getReceivers(emitter) {
        if (emitter._receivers === undefined) {
            return null;
        }
        return emitter._receivers.map(function (r) { return inspector.describeReceiver(r, emitter); });
    }
    inspector.getReceivers = getReceivers;
    function describeReceiver(receiver, ofEmitter) {
        // function
        if (typeof receiver === 'function') {
            return {
                name: rn(receiver.name),
                value: receiver
            };
        }
        else if (receiver.input = ofEmitter && receiver.output !== undefined) {
            return {
                name: receiver.output.toString(),
                value: receiver.output
            };
        }
        // wire without in/out
        return {
            name: receiver.toString(),
            value: receiver
        };
    }
    inspector.describeReceiver = describeReceiver;
    function getEmitters(transformator) {
        if (transformator._wires === undefined) {
            return null;
        }
        return transformator._wires.map(function (w) { return ({
            name: w.input.toString(),
            value: w.input
        }); });
    }
    inspector.getEmitters = getEmitters;
})(inspector = exports.inspector || (exports.inspector = {}));
var Graph = (function () {
    function Graph(source) {
        this.nodesById = {};
        this.id = 0;
        this._sources = [];
        var lastSourceId = this.insert(source);
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
    Graph.prototype.insert = function (source) {
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
            if (e._emitter !== undefined) {
                e = e._emitter;
            }
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
            if (r._emitter !== undefined) {
                r = r._emitter;
            }
            var rId = _this.insert(r);
            _this.nodesById[source.__$visualize_visited_id$].receivers.push(rId);
        });
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
exports.Graph = Graph;
