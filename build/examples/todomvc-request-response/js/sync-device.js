var electric = require('../../../src/electric');
var eevent = require('../../../src/electric-event');
var item = require('./item');
var request = require('../../../src/devices/request');
var URL = 'http://localhost:8081';
var POST = 'POST';
var GET = 'GET';
function sync(userActivated, tasks) {
    var tasksChanges = electric.transformator.skipFirst(electric.transformator.changes(tasks));
    var initialRequestState = electric.emitter.manual('waiting');
    var initialTasks = electric.emitter.manualEvent();
    makeInitialRequest(initialRequestState, initialTasks);
    var state = electric.emitter.placeholder('none');
    var stateChange = electric.transformator.changes(state);
    var shouldSyncTasks = electric.emitter.constant(eevent.notHappend).change({
        to: function (_, diff) {
            if (diff.next === 'success' || diff.next === 'waiting') {
                return electric.emitter.constant(eevent.notHappend);
            }
            else {
                return userActivated.merge(electric.clock.interval(30 * 1000));
            }
        },
        when: stateChange
    });
    var tasksToSync = electric.transformator.map(function (should, ts) { return should.map(function (_) { return ts; }); }, shouldSyncTasks, tasks);
    var requestsDevice = createRequestsDevice(tasksToSync);
    state.is(initialRequestState.change({
        to: function (fromState, toState) {
            return electric.emitter.constant(toState);
        }, when: requestsDevice.stateChange
    }, { to: electric.emitter.constant('none'), when: tasksChanges }));
    return {
        state: state,
        initialTasks: initialTasks
    };
}
function makeInitialRequest(initialRequestState, initialTasks) {
    request.request(GET, URL, function (response) {
        initialRequestState.emit(response.status);
        if (response.status === 'success') {
            initialTasks.impulse(response.data.map(item.restore));
        }
    }, { decode: JSON.parse });
}
function createRequestsDevice(data) {
    return request.JSONRequestDevice(POST, URL, data);
}
module.exports = sync;
