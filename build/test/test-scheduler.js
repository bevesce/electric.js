// import chai = require("chai");
// var expect = chai.expect;
// import electric = require("../server/electric");
// describe('electric test scheduler', function() {
//     it('should be exported', function() {
//         expect(electric.scheduler).to.not.be.undefined;
//     });
//     it('should allow to stop time and advance it', function() {
//         electric.scheduler.stop();
//         var stopTime = electric.scheduler.currentTime();
//         electric.scheduler.advance(1);
//         expect(stopTime + 1).to.equal(electric.scheduler.currentTime());
//     });
//     it('should schedule callbacks for execution', function() {
//         var r: number;
//         electric.scheduler.stop();
//         electric.scheduler.scheduleTimeout(() => r = 1);
//         electric.scheduler.advance(1);
//         expect(r).to.equal(1);
//     });
//     it("shouldn't call callback to early", function() {
//         var r: number;
//         electric.scheduler.stop();
//         electric.scheduler.scheduleTimeout(() => r = 1, 2);
//         expect(r).to.be.undefined;
//         electric.scheduler.advance();
//         expect(r).to.be.undefined;
//         electric.scheduler.advance(2);
//         expect(r).to.equal(1);
//     });
//     it('should call multiple callbacks on the same time', function() {
//         var r: number[] = [];
//         electric.scheduler.stop();
//         electric.scheduler.scheduleTimeout(() => r[0] = 1, 2);
//         electric.scheduler.scheduleTimeout(() => r[1] = 2, 2);
//         expect(r[0]).to.be.undefined;
//         expect(r[1]).to.be.undefined;
//         electric.scheduler.advance(3);
//         expect(r[0]).to.equal(1);
//         expect(r[1]).to.equal(2);
//     });
//     it('should schedule callback for execution with interval', function() {
//         var r = 0;
//         electric.scheduler.stop();
//         electric.scheduler.scheduleInterval(() => r++, 2);
//         expect(r).to.equal(0);
//         electric.scheduler.advance(1);
//         expect(r).to.equal(0);
//         electric.scheduler.advance(2);
//         expect(r).to.equal(1);
//         electric.scheduler.advance(2);
//         expect(r).to.equal(2);
//     });
// });
