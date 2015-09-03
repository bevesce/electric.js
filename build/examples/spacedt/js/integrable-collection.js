var IntegrableCollection = (function () {
    function IntegrableCollection(items) {
        this.items = items;
    }
    IntegrableCollection.of = function (items) {
        return new IntegrableCollection(items);
    };
    IntegrableCollection.prototype.add = function (other) {
        var result = {};
        for (var key in other.items) {
            var otherItem = other.items[key];
            var thisItem = this.items[key];
            result[key] = (thisItem ? thisItem.add(otherItem) : otherItem);
        }
        return IntegrableCollection.of(result);
    };
    IntegrableCollection.prototype.mulT = function (dt) {
        var result = {};
        for (var key in this.items) {
            result[key] = this.items[key].mulT(dt);
        }
        return AntiderivativeCollection.of(result);
    };
    IntegrableCollection.prototype.insert = function (key, item) {
        var result = IntegrableCollection.of(cop(this.items));
        result.items[key] = item;
        return result;
    };
    IntegrableCollection.prototype.remove = function (key) {
        var result = IntegrableCollection.of(cop(this.items));
        result.items[key] = undefined;
        return result;
    };
    return IntegrableCollection;
})();
exports.IntegrableCollection = IntegrableCollection;
var AntiderivativeCollection = (function () {
    function AntiderivativeCollection(items) {
        this.items = items;
    }
    AntiderivativeCollection.of = function (items) {
        return new AntiderivativeCollection(items);
    };
    AntiderivativeCollection.prototype.addDelta = function (delta) {
        var result = {};
        for (var key in this.items) {
            result[key] = this.items[key].addDelta(delta.items[key]);
        }
        return AntiderivativeCollection.of(result);
    };
    AntiderivativeCollection.prototype.equals = function (other) {
        return this._sameKeysAs(other) && this._sameValuesAs(other);
    };
    AntiderivativeCollection.prototype._sameKeysAs = function (other) {
        for (var key in this.items) {
            if (other.items[key] === undefined) {
                return false;
            }
        }
        for (var key in other.items) {
            if (this.items[key] === undefined) {
                return false;
            }
        }
        return true;
    };
    AntiderivativeCollection.prototype._sameValuesAs = function (other) {
        for (var key in this.items) {
            if (!this.items[key].equals(other.items[key])) {
                return false;
            }
        }
        return true;
    };
    return AntiderivativeCollection;
})();
exports.AntiderivativeCollection = AntiderivativeCollection;
function cop(d) {
    var result = {};
    for (var k in d) {
        result[k] = d[k];
    }
    return result;
}
