function identity(x) {
    return x;
}
exports.identity = identity;
;
function curry(f, arity) {
    if (arity === void 0) { arity = 2; }
    function partial(prevArgs) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            var nextArgs = prevArgs.slice();
            nextArgs.splice.apply(nextArgs, [nextArgs.length, 0].concat(args));
            if (nextArgs.length >= arity) {
                return f.apply(void 0, nextArgs);
            }
            return partial(nextArgs);
        };
    }
    return partial([]);
}
exports.curry = curry;
;
function property(name) {
    return function (obj) {
        return obj[name];
    };
}
exports.property = property;
;
function compose(f, g) {
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return f(g.apply(void 0, args));
    };
}
exports.compose = compose;
var maybe;
(function (maybe) {
    var Just = (function () {
        function Just(value) {
            this.value = value;
        }
        Just.prototype.map = function (f) {
            var result = f(this.flatten());
            return just(result);
        };
        Just.prototype.flatten = function () {
            return this.value;
        };
        Just.prototype.chain = function (f) {
            return this.map(f).flatten();
        };
        return Just;
    })();
    function just(value) {
        return new Just(value);
    }
    maybe.just = just;
    var Nothing = (function () {
        function Nothing() {
        }
        Nothing.prototype.map = function (f) {
            return maybe.nothing;
        };
        Nothing.prototype.bind = function (f) {
            return maybe.nothing;
        };
        Nothing.prototype.flatten = function () {
            throw Error("can't flatten Nothing");
        };
        Nothing.prototype.chain = function (f) {
            return maybe.nothing;
        };
        return Nothing;
    })();
    maybe.nothing = new Nothing();
})(maybe = exports.maybe || (exports.maybe = {}));
var either;
(function (either) {
    var Right = (function () {
        function Right(value) {
            this.value = value;
        }
        Right.prototype.map = function (f) {
            var result = f(this.flatten());
            return right(result);
        };
        Right.prototype.flatten = function () {
            return this.value;
        };
        Right.prototype.chain = function (f) {
            return this.map(f).flatten();
        };
        Right.prototype.isRight = function () {
            return true;
        };
        Right.prototype.isLeft = function () {
            return false;
        };
        return Right;
    })();
    function right(value) {
        return new Right(value);
    }
    either.right = right;
    var Left = (function () {
        function Left(value) {
            this.lvalue = value;
        }
        Left.prototype.map = function (f) {
            return left(this.lvalue);
        };
        Left.prototype.flatten = function () {
            throw Error("can't flatten Left");
        };
        Left.prototype.chain = function (f) {
            return left(this.lvalue);
        };
        Left.prototype.isRight = function () {
            return false;
        };
        Left.prototype.isLeft = function () {
            return true;
        };
        return Left;
    })();
    function left(value) {
        return (new Left(value));
        // when remove <any> casting:
        // Neither type 'Left<L, {}>' nor type 'Either<L, R>' is assignable to the other.
        // Types of property 'flatten' are incompatible.
        // Type '() => {} | Either<L, {}>' is not assignable to type '() => R | Monad<R>'.
        // Type '{} | Either<L, {}>' is not assignable to type 'R | Monad<R>'.
        // Type '{}' is not assignable to type 'R | Monad<R>'.
        // Type '{}' is not assignable to type 'Monad<R>'.
        // Property 'flatten' is missing in type '{}'.
    }
    either.left = left;
})(either = exports.either || (exports.either = {}));
