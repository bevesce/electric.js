/// <reference path="../d/chai.d.ts" />
/// <reference path="../d/mocha.d.ts" />
var chai = require('chai');
// electricKettle.pour(chai);
var expect = chai.expect;
var fp = require('../src/fp');
describe('fp', function () {
    describe('curry', function () {
        var curry = fp.curry;
        it('should be exported', function () {
            expect(fp.curry).to.not.be.undefined;
        });
        it('should work with 2 arguments by default', function () {
            function f(x, y) {
                return x + y;
            }
            ;
            var g = curry(f);
            expect(g(1)(3)).to.equal(4);
            expect(g(100)(2)).to.equal(102);
            expect(g(200, 2)).to.equal(202);
        });
        it('should work with 3 arguments', function () {
            function f(x, y, z) {
                return x + y + z;
            }
            ;
            var g = curry(f, 3);
            expect(g(1, 2, 3)).to.equal(6);
            expect(g(1)(2, 3)).to.equal(6);
            expect(g(1, 2)(3)).to.equal(6);
            expect(g(1)(2)(3)).to.equal(6);
        });
        it('should work with 4 arguments', function () {
            function f(w, x, y, z) {
                return w + x + y + z;
            }
            ;
            var g = curry(f, 4);
            expect(g(1, 2, 3, 4)).to.equal(10);
            expect(g(1)(2, 3, 4)).to.equal(10);
            expect(g(1, 2)(3, 4)).to.equal(10);
            expect(g(1)(2)(3)(4)).to.equal(10);
        });
        it('should be able to finish function with different args', function () {
            function f(x, y, z) {
                return x + y + z;
            }
            var g = curry(f, 3);
            var add2 = g(2);
            var add2then3 = add2(3);
            var add2then4 = add2(4);
            expect(add2then3(10)).to.equal(15);
            expect(add2then4(10)).to.equal(16);
        });
    });
    describe('property', function () {
        var property = fp.property;
        it('should get properties from object', function () {
            expect(property('a')({ a: 1 })).to.equal(1);
            expect(property('b')({ a: 1, b: 2 })).to.equal(2);
        });
    });
    describe('compose', function () {
        var compose = fp.compose;
        it('should compose function', function () {
            function f(x) {
                return x + '!!!';
            }
            function g(x) {
                return 2 * x;
            }
            var h = compose(f, g);
            expect(h(1)).to.equal('2!!!');
        });
        it('should work on many arguments', function () {
            function f(x) {
                return x + '!!!';
            }
            function g(x, y) {
                return x + y;
            }
            var h = compose(f, g);
            expect(h(1, 2)).to.equal('3!!!');
        });
    });
    var id = function (x) {
        return x;
    };
    var compose = fp.compose;
    function f(x) {
        return x + '!';
    }
    function g(x) {
        return x * 2;
    }
    describe('maybe', function () {
        var just = fp.maybe.just;
        var nothing = fp.maybe.nothing;
        function h(x) {
            return just(g(x));
        }
        function j(x) {
            return just(f(x));
        }
        it('just should be a functor', function () {
            var result = just(3).map(f).flatten();
            expect(result).to.equal('3!');
        });
        it('nothing should be a functor', function () {
            var mapped = nothing.map(f);
            expect(mapped).to.equal(nothing);
        });
        it('should be chainable as functor', function () {
            expect(just(1).map(g).map(f).flatten()).to.equal('2!');
        });
        it('should meet functor law: map id = id', function () {
            expect(just(1).map(id).flatten()).to.equal(1);
        });
        it('should meet functor law: map f.g = map f . map g', function () {
            var v = just(1);
            expect(v.map(compose(f, g)).flatten()).to.equal(v.map(g).map(f).flatten());
        });
        it('just should be a monad', function () {
            expect(just(1).chain(h).flatten()).to.equal(2);
            expect(just(1).chain(function (x) { return nothing; })).to.equal(nothing);
        });
        it('nothing should be a monad', function () {
            expect(nothing.chain(function (x) { return just(3); })).to.equal(nothing);
        });
        it('should meet monad law: return x >>= f = f x', function () {
            expect(just(1).chain(h).flatten()).to.equal(h(1).flatten());
        });
        it('should meet monad law: m >>= return = m', function () {
            expect(just(1).chain(just).flatten()).to.equal(just(1).flatten());
        });
        it('should meet monad law: (m >>= f) >>= g = m >>= (x -> f x >>= g)', function () {
            expect(just(1).chain(h).chain(j).flatten()).to.equal(just(1).chain(function (x) { return h(x).chain(j); }).flatten());
        });
    });
    describe('either', function () {
        var right = fp.either.right;
        var left = fp.either.left;
        function h(x) {
            return right(g(x));
        }
        function j(x) {
            return right(f(x));
        }
        it('right should be a functor', function () {
            var result = right(3).map(f).flatten();
            expect(result).to.equal('3!');
        });
        it("left shouldn't be a functor", function () {
            expect(function () { return left(3).map(f).flatten(); }).to.throw(Error);
        });
        it('should be chainable as functor', function () {
            expect(right(1).map(g).map(f).flatten()).to.equal('2!');
        });
        it('right should meet functor law: map id = id', function () {
            expect(right(1).map(id).flatten()).to.equal(1);
        });
        it('right should meet functor law: map f.g = map f . map g', function () {
            var v = right(1);
            expect(v.map(compose(f, g)).flatten()).to.equal(v.map(g).map(f).flatten());
        });
        it('left should meet functor law: map id = id', function () {
            expect(left(1).map(id).lvalue).to.equal(1);
        });
        it('left should meet functor law: map f.g = map f . map g', function () {
            var v = left(1);
            expect(v.map(compose(f, g)).value).to.equal(v.map(g).map(f).value);
        });
        it('right should be a monad', function () {
            expect(right(1).chain(h).flatten()).to.equal(2);
            expect(right(1).chain(function (x) { return left('err'); })).to.eql(left('err'));
        });
        it('left should be a monad', function () {
            expect(left(1).chain(function (x) { return right(3); }).lvalue).to.equal(1);
        });
        it('right should meet monad law: return x >>= f = f x', function () {
            expect(right(1).chain(h).flatten()).to.equal(h(1).flatten());
        });
        it('right should meet monad law: m >>= return = m', function () {
            expect(right(1).chain(right).flatten()).to.equal(right(1).flatten());
        });
        it('right should meet monad law: (m >>= f) >>= g = m >>= (x -> f x >>= g)', function () {
            expect(right(1).chain(h).chain(j).flatten()).to.equal(right(1).chain(function (x) { return h(x).chain(j); }).flatten());
        });
        it('left should meet monad law: m >>= return = m', function () {
            expect(left(1).chain(right).value).to.equal(left(1).value);
        });
        it('left should meet monad law: (m >>= f) >>= g = m >>= (x -> f x >>= g)', function () {
            expect(left(1).chain(h).chain(j).value).to.equal(left(1).chain(function (x) { return h(x).chain(j); }).value);
        });
    });
});
