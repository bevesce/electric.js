import React = require('react');
import utils = require('./utils');
import inf = require('../interfaces');


export function jsxReceiver(nodeOrId: utils.Node | string) {
	var node = utils.getNode(nodeOrId);
	return function(jsx: any) {
		React.render(jsx, node)
	}
};

export function electricStateComponent(
	emitter: inf.IEmitter<any>, objectSpecification: any
) {
	objectSpecification.getInitialState = function() {
		return emitter.dirtyCurrentValue();
	}

	objectSpecification.componentDidMount = function() {
		emitter.plugReceiver(this._onChange);
	}

	objectSpecification._onChange = function(state: any) {
		this.setState(state);
	}

	objectSpecification.componentWillUnmount = function() {
		emitter.unplugReceiver(this._onChange);
	}

	return React.createClass(objectSpecification);
};

