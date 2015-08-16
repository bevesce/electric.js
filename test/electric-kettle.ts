export function pour(chai: any){
// expect(how_many).receivers.ofA(emitter)
//     .to.receive(x).when.emitted(x).from(emitter)
//     .to.receive(y).when.emitted(y).from(emitter)
    chai.use(function(_chai: any, utils: any) {
        var assertion = _chai.Assertion;
        assertion.addProperty('receivers', function() {
            var noReceivers = this._obj;
            var receivers = Array(noReceivers);
            var received = Array(noReceivers);
            for (var i = 0; i < noReceivers; i++) {
                (function(i: number) {
                    receivers[i] = (function(x: any) { received[i] = x });
                })(i);
            }
            utils.flag(assertion, 'receivers', receivers);
            utils.flag(assertion, 'received', received);
        });
        assertion.addMethod('ofA', function(emitter: any) {
            for (var receiver of utils.flag(assertion, 'receivers')) {
                emitter.plugReceiver(receiver);
            }
        });
        assertion.addMethod('receive', function(valueToReceive: any) {
            utils.flag(assertion, 'value expected to receive', valueToReceive);
        });
        assertion.addProperty('when', function() {

        });
        assertion.addMethod('emitted', function(valueToEmitt: any) {
            utils.flag(assertion, 'value to emit', valueToEmitt);
        });
        assertion.addMethod('from', function(emitter: any) {
            emitter.emit(utils.flag(assertion, 'value to emit'));
            var expected = utils.flag(assertion, 'value expected to receive');
            for (var received of utils.flag(assertion, 'received')) {
                this.assert(
                    received === expected,
                    'received ' + received + ' when expected ' + expected,
                    'received' + received + ' when not expected'
                )
            }
        });
    });
// expect(emitter).to.emit
//    .values(0)
//    .then.after(() => {emitter.emit(1), emmiter.emit(2)})
//    .values(1, 2)
    chai.use(function(_chai: any, utils: any) {
        var assertion = _chai.Assertion;
        assertion.addProperty('emit', function() {
            var emitter = this._obj;
            var emitted: any[] = [];
            utils.flag(assertion, 'emitted', emitted);
            emitter.plugReceiver((x: any) => emitted.push(x));
            utils.flag(assertion, 'values', []);
        });
        assertion.addProperty('then', function() { });
        assertion.addProperty('_show', function() {
            var emitted = utils.flag(assertion, 'emitted');
            console.log(emitted);
        });
        assertion.addMethod('after', function(after: any) {
            after();
        });
        assertion.addMethod('values', function(...values: any[]) {
            var values: any[] = utils.flag(assertion, 'values').concat(values);
            utils.flag(assertion, 'values', values);
            var emitted = utils.flag(assertion, 'emitted');
            chai.expect(emitted).to.deep.equal(values);
        });
    });
};
