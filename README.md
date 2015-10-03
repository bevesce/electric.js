# Electric.js 
## version 0.0.0

Documentation is under construction.
Electric.js lets you create reactive applications similary to building electric circuits. 


## Changelog

- 2015-09-25 - release 0.0.0

## Installation

Electric.js is a CommonJS module so you can use it with webpack, browserify or similar tools. Compiled library is in build/src, main file to require is *electric.js*.

# Core

## Emitters

- `emitter.manual`
- `emitter.manualEvent`
- `clock.time`
- `clock.interval`
- `clock.once`

## Devices

- `transformator.map`
- `transformator.filter`
- `transformator.merge`
- `transformator.flatten`
- `transformator.flattenMany`
- `transformator.when`
- `transformator.change`
- `transformator.changes`
- `transformator.transformTime`
- `calculus.integral`
- `calculus.differential`

## Receivers

- `receiver.log`
- `receiver.logEvent`

## Recursion

## Graph



# Other modules

## Electric-Kettle

*Electric-Kettle* let's you test emitters and devices using [mocha](http://mochajs.org) and [chai](http://chaijs.com):

```js
import kettle = require('./electric-kettle');
import chai = require("chai");

var expect = chai.expect;
kettle.pourAsync(expect);

describe('electric emitter', function() {
    it('should emit changing values', function(done) {
        var emitter = electric.emitter.manual(0);
        expect(emitter)
            .to.emit(0)
            .then.after(() => emitter.emit(7))
            .to.emit(7)
            .then.after(() => emitter.emit(13))
            .to.emit(13)
            .andBe(done);
    });
});
```

