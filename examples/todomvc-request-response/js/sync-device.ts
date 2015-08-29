import inf = require('../../../src/interfaces');
import electric = require('../../../src/electric');
import eevent = require('../../../src/electric-event');
import item = require('./item');
import request = require('../../../src/devices/request');

const URL = 'http://localhost:8081';
const POST = 'POST';
const GET = 'GET';

export = sync;

function sync(userActivated: inf.IEmitter<eevent<any>>, tasks: inf.IEmitter<item[]>) {
	var tasksChanges = electric.transformator.skipFirst(electric.transformator.changes(tasks));
	var initialRequestState = electric.emitter.manual('waiting');
	var initialTasks = electric.emitter.manualEvent();

	makeInitialRequest(initialRequestState, <electric.emitter.EventEmitter<item[]>>initialTasks);

	var state = electric.emitter.placeholder('none');
	var stateChange = electric.transformator.changes(state);
	var shouldSyncTasks = electric.emitter.constant(eevent.notHappend).change(
		{
			to: (_, diff) => {
				if (diff.next === 'success' || diff.next === 'waiting') {
					return electric.emitter.constant(eevent.notHappend);
				}
				else {
					return userActivated.merge(electric.clock.interval(30 * 1000))
				}
			},
			when: stateChange
		}
	);

	var tasksToSync = electric.transformator.map(
		(should, ts) => should.map(_ => ts),
		shouldSyncTasks, tasks
	);
	var requestsDevice = createRequestsDevice(tasksToSync);

	state.is(initialRequestState.change(
		{
			to: (fromState, toState) => {
				return electric.emitter.constant(toState);
			}, when: requestsDevice.stateChange
		}, //,
		{ to: electric.emitter.constant('none'), when: tasksChanges }
	));

	return {
		state: state,
		initialTasks: initialTasks,
	}
}


function makeInitialRequest(
	initialRequestState: electric.emitter.Emitter<string>,
	initialTasks: electric.emitter.EventEmitter<item[]>
) {
	request.request(
		GET,
		URL,
		(response) => {
			initialRequestState.emit(response.status);
			if (response.status === 'success') {
				initialTasks.impulse(response.data.map(item.restore));
			}
		},
		{ decode: JSON.parse }
	)
}

function createRequestsDevice(data: inf.IEmitter<eevent<any>>) {
	return request.JSONRequestDevice(
		POST, URL, data
	);
}
