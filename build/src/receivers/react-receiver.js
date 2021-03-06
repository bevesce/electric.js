/// <reference path="../../d/react.d.ts" />
var React = require('react');
var utils = require('./utils');
function jsxReceiver(nodeOrId) {
    var node = utils.getNode(nodeOrId);
    return function (jsx) {
        React.render(jsx, node);
    };
}
exports.jsxReceiver = jsxReceiver;
;
function electricStateComponent(emitter, objectSpecification) {
    objectSpecification.getInitialState = function () {
        return emitter.dirtyCurrentValue();
    };
    objectSpecification.componentDidMount = function () {
        emitter.plugReceiver(this._onChange);
    };
    objectSpecification._onChange = function (state) {
        this.setState(state);
    };
    objectSpecification.componentWillUnmount = function () {
        emitter.unplugReceiver(this._onChange);
    };
    return React.createClass(objectSpecification);
}
exports.electricStateComponent = electricStateComponent;
;
