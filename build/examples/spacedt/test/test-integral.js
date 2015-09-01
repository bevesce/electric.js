/// <reference path="../../../d/chai.d.ts" />
/// <reference path="../../../d/mocha.d.ts" />
var chai = require('chai');
var kettle = require('../../../test/electric-kettle');
kettle.pourAsync(chai);
var expect = chai.expect;
