// import electric = require('../../src/electric');
// import React = require('react');
// import electricReact = require('../../src/receivers/react');
// electric.clock.clock({intervalInMs: 1000})
// 	.map(function(t) {
// 		return <h1>{t}</h1>
// 	})
// 	.plugReceiver(
// 		electricReact.jsxReceiver('content')
// 	);
// function append(list, item) {
// 	var list = list.slice();
// 	list.push(item);
// 	return list;
// }
// time = electric.clock.clock({intervalInMs: 1000});
// list = electric.clock.clock({intervalInMs: 1000})
// 	.accumulate([], append);
// state = electric.transformator.map(
// 	function(time, list) {
// 		return {time: time, list: list};
// 	},
// 	time,
// 	list
// )
// var ClockApp = electricReact.electricStateComponent(
// 	state,
// 	{
// 		render: function() {
// 			return (
// 				<div>
// 					<h1>{this.state.time}</h1>
// 					<ul>
// 						{this.state.list.map(function(item) {
// 							return <li key={item}>{item}</li>
// 						})}
// 					</ul>
// 				</div>
// 			);
// 		}
// 	}
// );
// React.render(
// 	<ClockApp />,
// 	document.getElementById('component')
// );
