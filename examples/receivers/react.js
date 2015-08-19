requirejs([
	'../../build/client/electric',
	'../../bower_components/react/react.js',
	'../../build/client/receivers/react'
], function(
	electric, React, electricReact
) {
	console.log(electric);
	electric.clock.clock({intervalInMs: 1000})
		.map(function(t) {
			return React.createElement("h1", null, t)
		})
		.plugReceiver(
			electricReact.jsxReceiver('content')
		);

	function append(list, item) {
		var list = list.slice();
		list.push(item);
		return list;
	}

	time = electric.clock.clock({intervalInMs: 1000});
	list = electric.clock.clock({intervalInMs: 1000})
		.accumulate([], append);
	state = electric.transformator.map(
		function(time, list) {
			return {time: time, list: list};
		},
		time,
		list
	)

	var ClockApp = electricReact.electricStateComponent(
		state,
		{
			render: function() {
				return (
					React.createElement("div", null,
						React.createElement("h1", null, this.state.time),
						React.createElement("ul", null,
							this.state.list.map(function(item) {
								return React.createElement("li", {key: item}, item)
							})
						)
					)
				);
			}
		}
	);

	React.render(
		React.createElement(ClockApp, null),
		document.getElementById('component')
	);
});
