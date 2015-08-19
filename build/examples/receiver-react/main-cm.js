var electric = require('../../src/electric');
var React = require('react');
var electricReact = require('../../src/receivers/react');
electric.clock.clock({ intervalInMs: 1000 })
    .map(function (t) {
    return { t: t } < /h1>;
})
    .plugReceiver(electricReact.jsxReceiver('content'));
function append(list, item) {
    var list = list.slice();
    list.push(item);
    return list;
}
time = electric.clock.clock({ intervalInMs: 1000 });
list = electric.clock.clock({ intervalInMs: 1000 })
    .accumulate([], append);
state = electric.transformator.map(function (time, list) {
    return { time: time, list: list };
}, time, list);
var ClockApp = electricReact.electricStateComponent(state, {
    render: function () {
        return ({ this: .state.time } < /h1>
            < ul >
            { this: .state.list.map(function (item) {
                    return key;
                    {
                        item;
                    }
                     > { item: item } < /li>;
                }) }
            < /ul>
            < /div>);
    }
});
React.render(/>,, document.getElementById('component'));
