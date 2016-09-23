![icon](icon.png)

# Electric.js 

Exercise in implementing FRP-like framework in JavaScript. 

Look at examples if you want to know how it works. Not intended for production.

## Installation

Electric.js is a CommonJS module so you can use it with webpack, browserify or similar tools. Compiled library is in build/src, main file to require is *electric.js*.

## Core

Application written using Electric.js is build from `Emitters` that emit some data over time, `Devices` that transform it and `Receivers` that do something with this data.

### Emitters

- `emitter.manual`
- `emitter.manualEvent`
- `clock.time`
- `clock.interval`
- `clock.once`

### Devices

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

### Receivers

- `receiver.log`
- `receiver.logEvent`

### Application graph

Structure of application written using Electric.js is well organized - so well that it can be automatically represented as a graph. Loot at [examples/graph](https://github.com/bevesce/electric.js/blob/master/examples/graph/main.js) and [examples/spacedt](https://github.com/bevesce/electric.js/blob/master/examples/spacedt/js/app-cm.ts#L184)

### Recursion

It's valid to have cycle in devices/emitters graph. 

## Other modules

### Electric-Kettle

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
